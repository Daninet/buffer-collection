'use strict';

class BufferCollection {
  constructor () {
    this._bufs = [];
    this._length = 0;
    this._writeDoubleTempBuffer = Buffer.alloc(8);
    this._writeFloatTempBuffer = Buffer.alloc(4);
  }

  static alloc (size, fill, encoding) {
    return BufferCollection.from(Buffer.alloc(size, fill, encoding));
  }

  static allocUnsafe (size) {
    return BufferCollection.from(Buffer.allocUnsafe(size));
  }

  static allocUnsafeSlow (size) {
    return BufferCollection.from(Buffer.allocUnsafeSlow(size));
  }

  static byteLength (string, encoding) {
    return Buffer.byteLength(string, encoding);
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

  get (i) {
    return this.readUInt8(i, false);
  }

  read (len) {
    if (len < 1) {
      return false;
    }
    if (this._length < len) {
      return false;
    }
    const position =  this._getPositionByByteOffset(len - 1);
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
    }

    startOffset = startOffset === undefined ? this._length - bufferValue.length : startOffset;
    
    if (startOffset > this._length - bufferValue._length || startOffset < 0) {
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
    if (startOffset >= this._length || startOffset < 0) {
      return -1;
    }

    if (startOffset < 0) {
      startOffset = Math.max(0, this._length + startOffset);
    }

    startOffset = startOffset === undefined ? this._length - bufferValue.length : startOffset;
    if (startOffset > this._length - bufferValue._length || startOffset < 0) {
      return -1;
    }

    const position = this._getPositionByByteOffset(startOffset);
    if (!position) {
      return -1;
    }
    let globalOffset = startOffset;
    let offset = position.offset;
    for (let currentBufferKey = position.key; currentBufferKey >= 0; currentBufferKey--) {
      const buf = this._bufs[currentBufferKey];
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

  fill (value, offset = 0, end = null) {
    if (offset < 0) {
      throw new Error('Index out of range');
    }
    if (this._length === 0) {
      return this;
    }
    if (end !== null && offset >= end) {
      return this;
    }
    const buf = Buffer.from(value);
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
      const currentBuffer = this._bufs[currentBufferKey];
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
            done: true,
          };
        }

        const res = {
          value: [count++, this._bufs[key][offset]],
          done: false,
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
    }
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
    }
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
    let endPosition = end !== undefined ? this._getPositionByByteOffset(end) : null;
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
    return (this._bufs[b1.key][b1.offset] << 8) | this._bufs[b2.key][b2.offset];
  }

  readUInt16LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    return this._bufs[b1.key][b1.offset] | (this._bufs[b2.key][b2.offset] << 8);
  }

  readUInt32BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (
      (this._bufs[b1.key][b1.offset] * 0x1000000) +
      ((this._bufs[b2.key][b2.offset] << 16) |
      (this._bufs[b3.key][b3.offset] << 8) |
      (this._bufs[b4.key][b4.offset]))
    );
  }

  readUInt32LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (
      ((this._bufs[b1.key][b1.offset]) |
      (this._bufs[b2.key][b2.offset] << 8) |
      (this._bufs[b3.key][b3.offset] << 16)) +
      (this._bufs[b4.key][b4.offset] * 0x1000000)
    );
  }

  readInt8 (offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    const val = this._bufs[position.key][position.offset];
    return !(val & 0x80) ? val : (0xff - val + 1) * -1;
  }
  
  readInt16BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const val = (this._bufs[b1.key][b1.offset] << 8) | this._bufs[b2.key][b2.offset];
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
  }

  readInt16LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const val = this._bufs[b1.key][b1.offset] | (this._bufs[b2.key][b2.offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
  }

  readInt32BE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (
      (this._bufs[b1.key][b1.offset] << 24) |
      (this._bufs[b2.key][b2.offset] << 16) |
      (this._bufs[b3.key][b3.offset] << 8) |
      (this._bufs[b4.key][b4.offset])
    );
  }

  readInt32LE (offset, noAssert) {
    const b1 = this._getPositionByByteOffset(offset);
    const b2 = this._incrementPosition(b1);
    const b3 = this._incrementPosition(b2);
    const b4 = this._incrementPosition(b3);
    return (
      (this._bufs[b1.key][b1.offset]) |
      (this._bufs[b2.key][b2.offset] << 8) |
      (this._bufs[b3.key][b3.offset] << 16) |
      (this._bufs[b4.key][b4.offset] << 24)
    );
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
    }
  }

  toBuffer () {
    return Buffer.concat(this._bufs);
  }

  [Symbol.iterator] () {
    return this.values();
  }
}

module.exports = BufferCollection;