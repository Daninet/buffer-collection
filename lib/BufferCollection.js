'use strict';

class BufferCollection {
  constructor() {
    this._bufs = [];
    this._length = 0;
  }

  get length() {
    return this._length;
  }

  get count() {
    return this._bufs.length;
  }

  _getPositionByByteOffset(offset) {
    let c = 0;
    let bufCount = this._bufs.length;
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

  // gets first buffer from the beginning
  shiftBuffer () {
    if (this._bufs.length === 0) {
      return undefined;
    }
    this._length -= this._bufs[0].length;
    return this._bufs.shift();
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

  _verifyMatch(bufferValue, bufferIndex, bufferOffset, offset) {
    // check size
    if (bufferValue.length > this._length - offset) {
      return false;
    }

    let currentBuffer = this._bufs[bufferIndex];
    let c = 0;
    for (let i = 0; i < bufferValue.length; i++) {
      // console.log('for', i);
      if (bufferOffset + i - c >= currentBuffer.length) {
        c += currentBuffer.length - bufferOffset;
        currentBuffer = this._bufs[++bufferIndex];
        bufferOffset = 0;
      }
      if (bufferValue[i] !== currentBuffer[bufferOffset + i - c]) {
        // console.log('if2', i);
        return false;
      }
    }
    return true;
  }

  indexOf(value, startOffset = 0) {
    if (startOffset >= this._length || startOffset < 0) {
      return -1;
    }

    const bufferValue = Buffer.from(value);
    if (startOffset + bufferValue.length >= this._length) {
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
    const bufferValue = Buffer.from(value);
    startOffset = startOffset === undefined ? this._length - bufferValue.length : startOffset;
    if (startOffset > this._length - bufferValue.length || startOffset < 0) {
      return -1;
    }

    const position = this._getPositionByByteOffset(startOffset);
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
    const buf = Buffer.from(value);
    const startPosition = this._getPositionByByteOffset(offset);
    const endPosition = end === null ? { key: this._bufs.length - 1, offset: this._length } : this._getPositionByByteOffset(end);
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
      this._bufs.push(...obj._bufs);
      this._length += obj._length;
    } else if (obj instanceof Buffer) {
      this._bufs.push(obj);
      this._length += obj.length;
    } else {
      const buf = Buffer.from(obj);
      this._bufs.push(buf);
      this._length += buf.length;
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

  values() {
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
    // create new array with the new instances
    const arr = [];
    const startPosition = this._getPositionByByteOffset(start);
    let endPosition = end !== undefined ? this._getPositionByByteOffset(end) : null;
    if (endPosition === null) {
      endPosition = this._getPositionByByteOffset(this._length - 1);
      endPosition.offset++;
    }

    if (startPosition.key === endPosition.key) {
    
      arr.push(this._bufs[startPosition.key].slice(startPosition.offset, endPosition.offset));
    
    } else {

      // start element
      arr.push(this._bufs[startPosition.key].slice(startPosition.offset));
      
      // middle elements
      for (let key = startPosition.key + 1; key <= endPosition.key - 1; key++) {
        arr.push(this._bufs[key]);
      }

      // end element
      arr.push(this._bufs[endPosition.key].slice(0, endPosition.offset));
    
    }

    const newBuf = new BufferCollection();
    newBuf._bufs = arr;
    newBuf._length = 1;
    return newBuf;
  }

  readUInt8 (offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    return this._bufs[position.key].readUInt8(position.offset, noAssert);
  }

  writeUInt8 (value, offset, noAssert) {
    const position = this._getPositionByByteOffset(offset);
    return this._bufs[position.key].writeUInt8(value, position.offset, noAssert);
  }

  compact () {
    this._bufs = [Buffer.concat(this._bufs)];
    return this;
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
    // TODO
    // return Buffer.concat(this._bufs).equals(buf);
  }

  toString () {
    return this._bufs.map((buf) => buf.toString()).join('');
  }

  [Symbol.iterator] () {
    return this.values();
  }
}

module.exports = BufferCollection;