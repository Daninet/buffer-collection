'use strict';

class BufferCollection {
  constructor () {
    this._bufs = [];
    this._length = 0;
    this._writeDoubleTempBuffer = Buffer.alloc(8);
    this._writeFloatTempBuffer = Buffer.alloc(4);
  }

  static alloc (size, fill, encoding) {
    const buf = new BufferCollection();
    buf.push(Buffer.alloc(size, fill, encoding));
    return buf;
  }

  static allocUnsafe (size) {
    const buf = new BufferCollection();
    buf.push(Buffer.allocUnsafe(size));
    return buf;
  }

  static allocUnsafeSlow (size) {
    const buf = new BufferCollection();
    buf.push(Buffer.allocUnsafeSlow(size));
    return buf;
  }

  static byteLength (string, encoding) {
    return Buffer.byteLength(string, encoding);
  }

  static concat (list, totalLength) {
    const buf = new BufferCollection();
    list.forEach(buffer => {
      if (buffer instanceof BufferCollection) {
        buf.push(buffer);
      } else {
        buf.push(Buffer.from(buffer));
      }
    });
    if (totalLength !== undefined && totalLength < buf.length) {
      return buf.slice(0, totalLength);
    }
    return buf;
  }

  static from (...args) {
    const buf = new BufferCollection();
    buf.push(Buffer.from(...args));
    return buf;
  }

  static isBuffer (buf) {
    return buf instanceof BufferCollection || Buffer.isBuffer(buf);
  }

  static isEncoding (encoding) {
    return Buffer.isEncoding(encoding);
  }

  static get poolSize () {
    return Buffer.poolSize;
  }

  get length () {
    return this._length;
  }

  get count () {
    return this._bufs.length;
  }

  _getPositionByByteOffset (offset) {
    let c = 0;
    const bufCount = this._bufs.length;
    for (let key = 0; key < bufCount; key++) {
      if (offset < c + this._bufs[key].length) {
        return {
          key,
          offset: offset - c
        };
      }
      c += this._bufs[key].length;
    }
    return null;
  }

  _incrementPosition (position) {
    if (!position) {
      return null;
    }
    if (position.offset + 1 >= this._bufs[position.key].length) {
      if (position.key + 1 < this._bufs.length) {
        return {
          key: position.key + 1,
          offset: 0
        };
      } else {
        return null;
      }
    }
    return {
      key: position.key,
      offset: position.offset + 1
    };
  }

  // gets first buffer from the beginning
  shiftBuffer () {
    if (this._bufs.length === 0) {
      return undefined;
    }
    this._length -= this._bufs[0].length;
    return this._bufs.shift();
  }

  get (offset) {
    return this.readUInt8(offset, false);
  }

  set (offset, value) {
    this.writeUInt8(value, offset, false);
  }

  read (len) {
    if (len < 1) {
      return false;
    }
    if (this._length < len) {
      return false;
    }
    const position = this._getPositionByByteOffset(len - 1);
    const lastKey = position.key;
    const ret = Buffer.concat(this._bufs, len);

    // remove used buffers
    if (lastKey > 0) {
      this._bufs = this._bufs.slice(lastKey + 1);
    }

    // cut first buffer
    if (this._bufs.length > 0) {
      this._bufs[0] = this._bufs[0].slice(position.offset + 1);
      if (this._bufs[0].length === 0) {
        this._bufs = this._bufs.slice(1);
      }
    }

    this._length -= len;

    return ret;
  }

  _verifyMatch (bufferCollection, bufferIndex, bufferOffset, offset) {
    // check size
    if (bufferCollection.length > this._length - offset) {
      return false;
    }

    let currentBuffer = this._bufs[bufferIndex];
    let c = 0;
    for (let i = 0; i < bufferCollection.length; i++) {
      if (bufferOffset + i - c >= currentBuffer.length) {
        c += currentBuffer.length - bufferOffset;
        currentBuffer = this._bufs[++bufferIndex];
        bufferOffset = 0;
      }
      if (bufferCollection.get && bufferCollection.get(i) !== currentBuffer[bufferOffset + i - c]) {
        return false;
      }
    }
    return true;
  }

  indexOf (value, startOffset = 0) {
    let bufferValue = value;
    if (!(value instanceof BufferCollection)) {
      bufferValue = BufferCollection.from(value);
    }

    if (bufferValue._length === 0) {
      return 0;
    }

    if (startOffset < 0) {
      startOffset = Math.max(0, this._length + startOffset);
    } else if (startOffset > this._length - bufferValue._length) {
      return -1;
    }

    const position = this._getPositionByByteOffset(startOffset);
    let globalOffset = startOffset;
    let offset = position.offset;
    for (let currentBufferKey = position.key; currentBufferKey < this._bufs.length; currentBufferKey++) {
      const buf = this._bufs[currentBufferKey];
      while (offset < buf.length) {
        const isMatch = this._verifyMatch(bufferValue, currentBufferKey, offset, globalOffset);
        if (isMatch) {
          return globalOffset;
        }
        offset++;
        globalOffset++;
      }
      offset = 0;
    }
    return -1;
  }

  lastIndexOf (value, startOffset) {
    let bufferValue = value;
    if (!(value instanceof BufferCollection)) {
      bufferValue = BufferCollection.from(value);
    }

    if (bufferValue._length === 0) {
      return 0;
    }

    if (startOffset < 0) {
      if (this._length + startOffset < 0) {
        return -1;
      }
      startOffset = this._length + startOffset;
    } else if (startOffset === undefined) {
      startOffset = this._length - 1;
    }

    startOffset = Math.min(this._length - 1, startOffset);

    const position = this._getPositionByByteOffset(startOffset);
    let globalOffset = startOffset;
    let offset = position.offset;
    for (let currentBufferKey = position.key; currentBufferKey >= 0; currentBufferKey--) {
      while (offset >= 0) {
        const isMatch = this._verifyMatch(bufferValue, currentBufferKey, offset, globalOffset);
        if (isMatch) {
          return globalOffset;
        }
        offset--;
        globalOffset--;
      }
      offset = this._bufs[currentBufferKey - 1] && this._bufs[currentBufferKey - 1].length - 1;
    }
    return -1;
  }

  includes (value, startOffset = 0) {
    return this.indexOf(value, startOffset) !== -1;
  }

  fill (value, offset = 0, end = null, encoding) {
    if (offset < 0) {
      throw new Error('Index out of range');
    }
    if (this._length === 0) {
      return this;
    }
    if (end !== null && end > 0 && offset >= end) {
      return this;
    }
    const buf = Buffer.from(value, encoding);
    if (buf.length === 0) {
      return this;
    }
    const startPosition = this._getPositionByByteOffset(offset);
    let endPosition;
    if (end === null) {
      endPosition = { key: this._bufs.length - 1, offset: this._length };
    } else if (end === this._length) {
      endPosition = { key: this._bufs.length - 1, offset: this._bufs[this._bufs.length - 1].length };
    } else {
      if (end < 0 || end > this._length) {
        throw new Error('Index out of range');
      }
      endPosition = this._getPositionByByteOffset(end);
    }

    let bufOffset = 0;
    for (let currentBufferKey = startPosition.key; currentBufferKey <= endPosition.key; currentBufferKey++) {
      const iStart = currentBufferKey === startPosition.key ? startPosition.offset : 0;
      const iEnd = currentBufferKey === endPosition.key ? endPosition.offset : this._bufs[currentBufferKey].length;
      for (let i = iStart; i < iEnd; i++) {
        this._bufs[currentBufferKey][i] = buf[bufOffset++];
        if (bufOffset === buf.length) {
          bufOffset = 0;
        }
      }
    }
    return this;
  }

  push (obj) {
    if (obj instanceof BufferCollection) {
      if (obj.length > 0) {
        this._bufs.push(...obj._bufs);
        this._length += obj._length;
      }
    } else if (obj instanceof Buffer) {
      if (obj.length > 0) {
        this._bufs.push(obj);
        this._length += obj.length;
      }
    } else {
      const buf = Buffer.from(obj);
      if (buf.length > 0) {
        this._bufs.push(buf);
        this._length += buf.length;
      }
    }
    return this;
  }

  // source is the current buffer
  copy (target, targetStart, sourceStart, sourceEnd) {
    Buffer.concat(this._bufs).copy(target, targetStart, sourceStart, sourceEnd);
    return this;
  }

  entries () {
    let key = 0;
    let offset = 0;
    let count = 0;
    let done = false;

    return {
      next: () => {
        if (done) {
          return {
            value: undefined,
            done: true
          };
        }

        const res = {
          value: [count++, this._bufs[key][offset]],
          done: false
        };

        if (offset >= this._bufs[key].length - 1) {
          offset = 0;
          key++;
          if (key === this._bufs.length) {
            done = true;
          }
        } else {
          offset++;
        }

        return res;
      }
    };
  }

  keys () {
    const entries = this.entries();
    return {
      next: () => {
        const it = entries.next();
        return {
          value: it.value && it.value[0],
          done: it.done
        };
      }
    };
  }

  values () {
    const entries = this.entries();
    return {
      next: () => {
        const it = entries.next();
        return {
          value: it.value && it.value[1],
          done: it.done
        };
      }
    };
  }

  // return new instance with the interval (same memory object)
  slice (start, end) {
    if (start < 0) {
      start = this._length + start;
    }
    if (end < 0) {
      end = this._length + end;
    }
    start = Math.max(0, start);
    end = Math.min(this._length, end);

    if (start >= this._length || end <= 0 || start >= end) {
      return new BufferCollection();
    }
    const startPosition = this._getPositionByByteOffset(start);
    let endPosition = this._getPositionByByteOffset(end);
    if (endPosition === null) {
      endPosition = this._getPositionByByteOffset(this._length - 1);
      endPosition.offset++;
    }

    const newBuf = new BufferCollection();

    if (startPosition.key === endPosition.key) {
      newBuf.push(this._bufs[startPosition.key].slice(startPosition.offset, endPosition.offset));
    } else {
      // start element
      newBuf.push(this._bufs[startPosition.key].slice(startPosition.offset));
      // middle elements
      for (let key = startPosition.key + 1; key <= endPosition.key - 1; key++) {
        newBuf.push(this._bufs[key]);
      }

      // end element
      newBuf.push(this._bufs[endPosition.key].slice(0, endPosition.offset));
    }

    return newBuf;
  }

  readDoubleBE (offset, noAssert) {
    return this.slice(offset, offset + 8).toBuffer().readDoubleBE(0, noAssert);
  }

  readDoubleLE (offset, noAssert) {
    return this.slice(offset, offset + 8).toBuffer().readDoubleLE(0, noAssert);
  }

  readFloatBE (offset, noAssert) {
    return this.slice(offset, offset + 4).toBuffer().readFloatBE(0, noAssert);
  }

  readFloatLE (offset, noAssert) {
    return this.slice(offset, offset + 4).toBuffer().readFloatLE(0, noAssert);
  }

  readUInt8 (offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    return this._bufs[position.key][position.offset];
  }

  readUInt16BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    return this._bufs[b1.key][b1.offset] * 2 ** 8 + this._bufs[b2.key][b2.offset];
  }

  readUInt16LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    return this._bufs[b1.key][b1.offset] + this._bufs[b2.key][b2.offset] * 2 ** 8;
  }

  readUInt24BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    return (
      this._bufs[b1.key][b1.offset] * 2 ** 16 +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset]
    );
  }

  readUInt24LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16
    );
  }

  readUInt32BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (
      this._bufs[b1.key][b1.offset] * 2 ** 24 +
      this._bufs[b2.key][b2.offset] * 2 ** 16 +
      this._bufs[b3.key][b3.offset] * 2 ** 8 +
      this._bufs[b4.key][b4.offset]
    );
  }

  readUInt32LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24
    );
  }

  readUInt40BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    return (
      this._bufs[b1.key][b1.offset] * 2 ** 32 +
      this._bufs[b2.key][b2.offset] * 2 ** 24 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 8 +
      this._bufs[b5.key][b5.offset]
    );
  }

  readUInt40LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24 +
      this._bufs[b5.key][b5.offset] * 2 ** 32
    );
  }

  readUInt48BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    const b6 = this._incrementPosition(b5);
    return (
      (this._bufs[b1.key][b1.offset] * 2 ** 8 + this._bufs[b2.key][b2.offset]) * 2 ** 32 +
      this._bufs[b3.key][b3.offset] * 2 ** 24 +
      this._bufs[b4.key][b4.offset] * 2 ** 16 +
      this._bufs[b5.key][b5.offset] * 2 ** 8 +
      this._bufs[b6.key][b6.offset]
    );
  }

  readUInt48LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    const b6 = this._incrementPosition(b5);
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24 +
      (this._bufs[b5.key][b5.offset] + this._bufs[b6.key][b6.offset] * 2 ** 8) * 2 ** 32
    );
  }

  readUIntBE (offset, byteLength, noAssert) {
    if (byteLength === 6) { return this.readUInt48BE(offset, byteLength); }
    if (byteLength === 5) { return this.readUInt40BE(offset, byteLength); }
    if (byteLength === 3) { return this.readUInt24BE(offset, byteLength); }
    if (byteLength === 4) { return this.readUInt32BE(offset, byteLength); }
    if (byteLength === 2) { return this.readUInt16BE(offset, byteLength); }
    if (byteLength === 1) { return this.readUInt8(offset, byteLength); }

    throw new Error('Bounds error');
  }

  readUIntLE (offset, byteLength, noAssert) {
    if (byteLength === 6) { return this.readUInt48LE(offset, byteLength); }
    if (byteLength === 5) { return this.readUInt40LE(offset, byteLength); }
    if (byteLength === 3) { return this.readUInt24LE(offset, byteLength); }
    if (byteLength === 4) { return this.readUInt32LE(offset, byteLength); }
    if (byteLength === 2) { return this.readUInt16LE(offset, byteLength); }
    if (byteLength === 1) { return this.readUInt8(offset, byteLength); }

    throw new Error('Bounds error');
  }

  readInt8 (offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    const val = this._bufs[position.key][position.offset];
    return val | (val & 2 ** 7) * 0x1fffffe;
  }

  readInt16BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const val = this._bufs[b1.key][b1.offset] * 2 ** 8 + this._bufs[b2.key][b2.offset];
    return val | (val & 2 ** 15) * 0x1fffe;
  }

  readInt16LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const val = this._bufs[b1.key][b1.offset] + this._bufs[b2.key][b2.offset] * 2 ** 8;
    return val | (val & 2 ** 15) * 0x1fffe;
  }

  readInt24BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const val =
      this._bufs[b1.key][b1.offset] * 2 ** 16 +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset];
    return val | (val & 2 ** 23) * 0x1fe;
  }

  readInt24LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const val =
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16;
    return val | (val & 2 ** 23) * 0x1fe;
  }

  readInt32BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (this._bufs[b1.key][b1.offset] << 24) + // Overflow
      this._bufs[b2.key][b2.offset] * 2 ** 16 +
      this._bufs[b3.key][b3.offset] * 2 ** 8 +
      this._bufs[b4.key][b4.offset];
  }

  readInt32LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      (this._bufs[b4.key][b4.offset] << 24); // Overflow
  }

  readInt40BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    return (this._bufs[b1.key][b1.offset] | (this._bufs[b1.key][b1.offset] & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
      this._bufs[b2.key][b2.offset] * 2 ** 24 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 8 +
      this._bufs[b5.key][b5.offset];
  }

  readInt40LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    return (this._bufs[b5.key][b5.offset] | (this._bufs[b5.key][b5.offset] & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24;
  }

  readInt48BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    const b6 = this._incrementPosition(b5);

    const val = this._bufs[b2.key][b2.offset] + this._bufs[b1.key][b1.offset] * 2 ** 8;
    return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
      this._bufs[b3.key][b3.offset] * 2 ** 24 +
      this._bufs[b4.key][b4.offset] * 2 ** 16 +
      this._bufs[b5.key][b5.offset] * 2 ** 8 +
      this._bufs[b6.key][b6.offset];
  }

  readInt48LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    const b5 = this._incrementPosition(b4);
    const b6 = this._incrementPosition(b5);

    const val = this._bufs[b5.key][b5.offset] + this._bufs[b6.key][b6.offset] * 2 ** 8;
    return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24;
  }

  readIntBE (offset, byteLength, noAssert) {
    if (byteLength === 6) { return this.readInt48BE(offset, byteLength); }
    if (byteLength === 5) { return this.readInt40BE(offset, byteLength); }
    if (byteLength === 3) { return this.readInt24BE(offset, byteLength); }
    if (byteLength === 4) { return this.readInt32BE(offset, byteLength); }
    if (byteLength === 2) { return this.readInt16BE(offset, byteLength); }
    if (byteLength === 1) { return this.readInt8(offset, byteLength); }

    throw new Error('Bounds error');
  }

  readIntLE (offset, byteLength, noAssert) {
    if (byteLength === 6) { return this.readInt48LE(offset, byteLength); }
    if (byteLength === 5) { return this.readInt40LE(offset, byteLength); }
    if (byteLength === 3) { return this.readInt24LE(offset, byteLength); }
    if (byteLength === 4) { return this.readInt32LE(offset, byteLength); }
    if (byteLength === 2) { return this.readInt16LE(offset, byteLength); }
    if (byteLength === 1) { return this.readInt8(offset, byteLength); }

    throw new Error('Bounds error');
  }

  write (string, offset = 0, length, encoding) {
    const data = Buffer.from(string, encoding);
    if (length === undefined) {
      length = Math.min(data.length, this._length - offset);
    }
    this.fill(data, offset, offset + length);
    return data.length;
  }

  writeInt8 (value, offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    this._bufs[position.key][position.offset] = value;
    return offset + 1;
  }

  writeInt16LE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    this._bufs[b1.key][b1.offset] = value;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    return offset + 2;
  }

  writeInt16BE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    this._bufs[b1.key][b1.offset] = value >>> 8;
    this._bufs[b2.key][b2.offset] = value;
    return offset + 2;
  }

  writeInt32LE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    this._bufs[b4.key][b4.offset] = value >>> 24;
    this._bufs[b3.key][b3.offset] = value >>> 16;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    this._bufs[b1.key][b1.offset] = value;
    return offset + 4;
  }

  writeInt32BE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    this._bufs[b1.key][b1.offset] = value >>> 24;
    this._bufs[b2.key][b2.offset] = value >>> 16;
    this._bufs[b3.key][b3.offset] = value >>> 8;
    this._bufs[b4.key][b4.offset] = value;
    return offset + 4;
  }

  _writeBytesLE (value, offset, byteLength, min, max) {
    if (value < min || value > max) {
      throw new Error(`Out of bounds ${value} ${min} ${max}`);
    }

    const pos = new Array(byteLength);
    pos[0] = this._getPositionByByteOffset(offset);
    for (let i = 1; i < byteLength; i++) {
      pos[i] = this._incrementPosition(pos[i - 1]);
    }

    let newVal;
    if (byteLength > 4) {
      newVal = Math.floor(value * 2 ** -32);
    }

    const forLen = Math.min(3, byteLength - 1);
    for (let i = 0; i <= forLen; i++) {
      this._bufs[pos[i].key][pos[i].offset] = value;
      value = value >>> 8;
    }

    if (byteLength === 6) {
      this._bufs[pos[4].key][pos[4].offset] = newVal;
      this._bufs[pos[5].key][pos[5].offset] = (newVal >>> 8);
    } else if (byteLength === 5) {
      this._bufs[pos[4].key][pos[4].offset] = newVal;
    }

    return offset + byteLength;
  }

  _writeBytesBE (value, offset, byteLength, min, max) {
    if (value < min || value > max) {
      throw new Error('Out of bounds');
    }
    const pos = new Array(byteLength);
    pos[0] = this._getPositionByByteOffset(offset);
    for (let i = 1; i < byteLength; i++) {
      pos[i] = this._incrementPosition(pos[i - 1]);
    }
    let shiftOffset = 0;

    if (byteLength === 6) {
      const newVal = Math.floor(value * 2 ** -32);
      this._bufs[pos[0].key][pos[0].offset] = (newVal >>> 8);
      this._bufs[pos[1].key][pos[1].offset] = newVal;
      shiftOffset = 2;
    } else if (byteLength === 5) {
      const newVal = Math.floor(value * 2 ** -32);
      this._bufs[pos[0].key][pos[0].offset] = newVal;
      shiftOffset = 1;
    }

    for (let i = Math.min(3, byteLength - 1); i >= 0; i--) {
      this._bufs[pos[shiftOffset + i].key][pos[shiftOffset + i].offset] = value;
      value = value >>> 8;
    }

    return offset + byteLength;
  }

  writeIntBE (value, offset, byteLength, noAssert) {
    if (byteLength === 6) { return this._writeBytesBE(value, offset, byteLength, -0x800000000000, 0x7fffffffffff); }
    if (byteLength === 5) { return this._writeBytesBE(value, offset, byteLength, -0x8000000000, 0x7fffffffff); }
    if (byteLength === 3) { return this._writeBytesBE(value, offset, byteLength, -0x800000, 0x7fffff); }
    if (byteLength === 4) { return this._writeBytesBE(value, offset, byteLength, -0x80000000, 0x7fffffff); }
    if (byteLength === 2) { return this._writeBytesBE(value, offset, byteLength, -0x8000, 0x7fff); }
    if (byteLength === 1) { return this._writeBytesBE(value, offset, byteLength, -0x80, 0x7f); }

    throw new Error('Bounds error');
  }

  writeUIntBE (value, offset, byteLength, noAssert) {
    if (byteLength === 6) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffffffffffff); }
    if (byteLength === 5) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffffffff); }
    if (byteLength === 3) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffff); }
    if (byteLength === 4) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffffff); }
    if (byteLength === 2) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffff); }
    if (byteLength === 1) { return this._writeBytesBE(value, offset, byteLength, 0, 0xff); }

    throw new Error('Bounds error');
  }

  writeIntLE (value, offset, byteLength, noAssert) {
    if (byteLength === 6) { return this._writeBytesLE(value, offset, byteLength, -0x800000000000, 0x7fffffffffff); }
    if (byteLength === 5) { return this._writeBytesLE(value, offset, byteLength, -0x8000000000, 0x7fffffffff); }
    if (byteLength === 3) { return this._writeBytesLE(value, offset, byteLength, -0x800000, 0x7fffff); }
    if (byteLength === 4) { return this._writeBytesLE(value, offset, byteLength, -0x80000000, 0x7fffffff); }
    if (byteLength === 2) { return this._writeBytesLE(value, offset, byteLength, -0x8000, 0x7fff); }
    if (byteLength === 1) { return this._writeBytesLE(value, offset, byteLength, -0x80, 0x7f); }

    throw new Error('Bounds error');
  }

  writeUIntLE (value, offset, byteLength, noAssert) {
    if (byteLength === 6) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffffffffffff); }
    if (byteLength === 5) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffffffff); }
    if (byteLength === 3) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffff); }
    if (byteLength === 4) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffffff); }
    if (byteLength === 2) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffff); }
    if (byteLength === 1) { return this._writeBytesLE(value, offset, byteLength, 0, 0xff); }

    throw new Error('Bounds error');
  }

  writeUInt8 (value, offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    this._bufs[position.key][position.offset] = value;
    return offset + 1;
  }

  writeUInt16LE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    this._bufs[b1.key][b1.offset] = value;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    return offset + 2;
  }

  writeUInt16BE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    this._bufs[b1.key][b1.offset] = value >>> 8;
    this._bufs[b2.key][b2.offset] = value;
    return offset + 2;
  }

  writeUInt32LE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    this._bufs[b4.key][b4.offset] = value >>> 24;
    this._bufs[b3.key][b3.offset] = value >>> 16;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    this._bufs[b1.key][b1.offset] = value;
    return offset + 4;
  }

  writeUInt32BE (value, offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    this._bufs[b1.key][b1.offset] = value >>> 24;
    this._bufs[b2.key][b2.offset] = value >>> 16;
    this._bufs[b3.key][b3.offset] = value >>> 8;
    this._bufs[b4.key][b4.offset] = value;
    return offset + 4;
  }

  writeDoubleLE (value, offset, noAssert) {
    this._writeDoubleTempBuffer.writeDoubleLE(value, 0, true);
    this.fill(this._writeDoubleTempBuffer, offset, offset + 8);
    return offset + 8;
  }

  writeDoubleBE (value, offset, noAssert) {
    this._writeDoubleTempBuffer.writeDoubleBE(value, 0, true);
    this.fill(this._writeDoubleTempBuffer, offset, offset + 8);
    return offset + 8;
  }

  writeFloatLE (value, offset, noAssert) {
    this._writeFloatTempBuffer.writeFloatLE(value, 0, true);
    this.fill(this._writeFloatTempBuffer, offset, offset + 4);
    return offset + 4;
  }

  writeFloatBE (value, offset, noAssert) {
    this._writeFloatTempBuffer.writeFloatBE(value, 0, true);
    this.fill(this._writeFloatTempBuffer, offset, offset + 4);
    return offset + 4;
  }

  compact () {
    this._bufs = [Buffer.concat(this._bufs)];
    return this;
  }

  compare (target, targetStart, targetEnd, sourceStart, sourceEnd) {
    if (!(target instanceof BufferCollection)) {
      target = BufferCollection.from(target);
    }

    const targetStartOffset = targetStart === undefined ? 0 : targetStart;
    const targetStartPosition = target._getPositionByByteOffset(targetStartOffset);

    const targetEndOffset = targetEnd !== undefined ? targetEnd : target._length;
    let targetEndPosition = targetEnd !== undefined ? target._getPositionByByteOffset(targetEndOffset) : null;
    if (targetEndPosition === null) {
      targetEndPosition = target._getPositionByByteOffset(targetEndOffset - 1);
      targetEndPosition.offset++;
    }
    const targetLength = targetEndOffset - targetStartOffset;

    const sourceStartOffset = sourceStart === undefined ? 0 : sourceStart;
    const sourceStartPosition = this._getPositionByByteOffset(sourceStartOffset);

    const sourceEndOffset = sourceEnd !== undefined ? sourceEnd : this._length;
    let sourceEndPosition = sourceEnd !== undefined ? this._getPositionByByteOffset(sourceEndOffset) : null;
    if (sourceEndPosition === null) {
      sourceEndPosition = this._getPositionByByteOffset(sourceEndOffset - 1);
      sourceEndPosition.offset++;
    }
    const sourceLength = sourceEndOffset - sourceStartOffset;

    const minLen = Math.min(targetLength, sourceLength);
    let currentSourcePos = sourceStartPosition;
    let currentTargetPos = targetStartPosition;
    for (let i = 0; i < minLen; i++) {
      const a = this._bufs[currentSourcePos.key][currentSourcePos.offset];
      const b = target._bufs[currentTargetPos.key][currentTargetPos.offset];
      if (a - b !== 0) {
        return a - b;
      }
      currentSourcePos = this._incrementPosition(currentSourcePos);
      currentTargetPos = target._incrementPosition(currentTargetPos);
    }
    if (sourceLength !== targetLength) {
      return sourceLength - targetLength;
    }
    return 0;
  }

  equals (cmpBuf) {
    let pos = 0;
    if (this._length !== cmpBuf.length) {
      return false;
    }
    for (let key = 0; key < this._bufs.length; key++) {
      const buf = this._bufs[key];
      if (!buf.equals(cmpBuf.slice(pos, pos + buf.length))) {
        return false;
      }
      pos += buf.length;
    }
    return true;
  }

  toString (encoding, start, end) {
    let c = 0;
    return this._bufs.map((buf) => {
      const s = start === undefined ? start : start - c;
      const e = end === undefined ? end : end - c;
      c += buf.length;
      if (e < 0 || s > buf.length) {
        return '';
      }
      return buf.toString(encoding, s, e);
    }).join('');
  }

  inspect () {
    const max = 50;
    let str = '';
    str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
    if (this.length > max) {
      str += ' ... ';
    }
    return `<${this.constructor.name} ${str}>`;
  }

  toJSON () {
    return {
      type: 'Buffer',
      data: [].concat(...this._bufs.map((buf) => buf.toJSON().data))
    };
  }

  toBuffer () {
    return Buffer.concat(this._bufs);
  }

  _getPositionArray (startPos, n) {
    const arr = new Array(n);
    arr[0] = startPos;
    for (let i = 1; i < n; i++) {
      arr[i] = this._incrementPosition(arr[i - 1]);
    }
    return arr;
  }

  _swapPositions (pos1, pos2) {
    const aux = this._bufs[pos1.key][pos1.offset];
    this._bufs[pos1.key][pos1.offset] = this._bufs[pos2.key][pos2.offset];
    this._bufs[pos2.key][pos2.offset] = aux;
  }

  swap16 () {
    if (this._length % 2 !== 0) {
      throw new Error('RangeError: Buffer size must be a multiple of 16-bits');
    }
    let pos = this._getPositionByByteOffset(0);

    for (let i = 0; i < this._length; i += 2) {
      const arr = this._getPositionArray(pos, 3);
      this._swapPositions(arr[0], arr[1]);
      pos = arr[2];
    }
    return this;
  }

  swap32 () {
    if (this._length % 4 !== 0) {
      throw new Error('RangeError: Buffer size must be a multiple of 32-bits');
    }
    let pos = this._getPositionByByteOffset(0);

    for (let i = 0; i < this._length; i += 4) {
      const arr = this._getPositionArray(pos, 5);
      this._swapPositions(arr[0], arr[3]);
      this._swapPositions(arr[1], arr[2]);
      pos = arr[4];
    }
    return this;
  }

  swap64 () {
    if (this._length % 8 !== 0) {
      throw new Error('RangeError: Buffer size must be a multiple of 64-bits');
    }
    let pos = this._getPositionByByteOffset(0);

    for (let i = 0; i < this._length; i += 8) {
      const arr = this._getPositionArray(pos, 9);
      this._swapPositions(arr[0], arr[7]);
      this._swapPositions(arr[1], arr[6]);
      this._swapPositions(arr[2], arr[5]);
      this._swapPositions(arr[3], arr[4]);
      pos = arr[8];
    }
    return this;
  }

  [Symbol.iterator] () {
    return this.values();
  }
}

module.exports = BufferCollection;
