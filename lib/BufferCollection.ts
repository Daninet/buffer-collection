interface IPosition {
  key: number;
  offset: number;
};

type IPositionOrNull = IPosition | null;

type BufferFromTypes = ArrayBuffer | SharedArrayBuffer | number[] | Uint8Array | string;

export default class BufferCollection {
  private _bufs: Buffer[] = [];
  private _length: number = 0;
  private _writeDoubleTempBuffer = Buffer.alloc(8);
  private _writeFloatTempBuffer = Buffer.alloc(4);

  /**
   * Allocates a new buffer of {size} octets.
   *
   * @param size count of octets to allocate.
   * @param fill if specified, buffer will be initialized by calling buf.fill(fill).
   *    If parameter is omitted, buffer will be filled with zeros.
   * @param encoding encoding used for call to buf.fill while initalizing
   */
  static alloc (size: number, fill?: string | Buffer | number, encoding?: BufferEncoding): BufferCollection {
    const buf = new BufferCollection();
    buf.push(Buffer.alloc(size, fill, encoding));
    return buf;
  }

  /**
   * Allocates a new buffer of {size} octets, leaving memory not initialized, so the contents
   * of the newly created Buffer are unknown and may contain sensitive data.
   *
   * @param size count of octets to allocate
   */
  static allocUnsafe (size: number): BufferCollection {
    const buf = new BufferCollection();
    buf.push(Buffer.allocUnsafe(size));
    return buf;
  }

  /**
   * Allocates a new non-pooled buffer of {size} octets, leaving memory not initialized, so the contents
   * of the newly created Buffer are unknown and may contain sensitive data.
   *
   * @param size count of octets to allocate
   */
  static allocUnsafeSlow (size: number): BufferCollection {
    const buf = new BufferCollection();
    buf.push(Buffer.allocUnsafeSlow(size));
    return buf;
  }

  /**
   * Gives the actual byte length of a string. encoding defaults to 'utf8'.
   * This is not the same as String.prototype.length since that returns the number of characters in a string.
   *
   * @param string string to test.
   * @param encoding encoding used to evaluate (defaults to 'utf8')
   */
  static byteLength (string: string | NodeJS.TypedArray | DataView | ArrayBuffer | SharedArrayBuffer, encoding?: BufferEncoding): number {
    return Buffer.byteLength(string, encoding);
  }

  /**
   * Returns a buffer which is the result of concatenating all the buffers in the list together.
   *
   * If the list has no items, or if the totalLength is 0, then it returns a zero-length buffer.
   * If the list has exactly one item, then the first item of the list is returned.
   * If the list has more than one item, then a new Buffer is created.
   *
   * @param list An array of Buffer objects to concatenate
   * @param totalLength Total length of the buffers when concatenated.
   *   If totalLength is not provided, it is read from the buffers in the list. However, this adds an additional loop to the function, so it is faster to provide the length explicitly.
   */
  static concat (list: BufferFromTypes[] | Buffer[] | BufferCollection[], totalLength?: number): BufferCollection {
    const buf = new BufferCollection();
    list.forEach(buffer => {
      if (buffer instanceof BufferCollection) {
        buf.push(buffer);
      } else if (buffer instanceof Buffer) {
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

  static from (values: BufferFromTypes | Buffer | BufferCollection, byteOffset?: number, length?: number): BufferCollection {
    const buf = new BufferCollection();
    if (values instanceof BufferCollection) {
      buf.push(values.toBuffer());
    } else if (values instanceof Buffer) {
      buf.push(values);
    } else if (values instanceof ArrayBuffer || values instanceof SharedArrayBuffer) {
      buf.push(Buffer.from(values, byteOffset, length));
    } else {
      buf.push(Buffer.from(values as any));
    }
    return buf;
  }

  /**
   * Returns true if {buf} is a Buffer
   *
   * @param buf object to test.
   */
  static isBuffer (buf: any): boolean {
    return buf instanceof BufferCollection || Buffer.isBuffer(buf);
  }

  /**
   * Returns true if {encoding} is a valid encoding argument.
   * Valid string encodings in Node 0.12: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'binary'(deprecated)|'hex'
   *
   * @param encoding string to test.
   */
  static isEncoding (encoding: string): boolean {
    return Buffer.isEncoding(encoding);
  }

  /**
   * This is the number of bytes used to determine the size of pre-allocated, internal Buffer instances used for pooling. This value may be modified.
   */
  static get poolSize (): number {
    return Buffer.poolSize;
  }

  /**
    * Gets the length of the buffer.
    */
  get length (): number {
    return this._length;
  }

  /**
    * Gets the number of embedded buffers.
    */
  get count (): number {
    return this._bufs.length;
  }

  _getPositionByByteOffset (offset: number): IPositionOrNull {
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

  _incrementPosition (position: IPositionOrNull): IPositionOrNull {
    if (!position) {
      return null;
    }
    if (position.offset + 1 >= this._bufs[position.key].length) {
      if (position.key + 1 < this._bufs.length) {
        return {
          key: position.key + 1,
          offset: 0,
        };
      } else {
        return null;
      }
    }
    return {
      key: position.key,
      offset: position.offset + 1,
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

  get (offset: number): number {
    return this.readUInt8(offset);
  }

  set (offset: number, value: number): void {
    this.writeUInt8(value, offset);
  }

  read (len: number): Buffer | false {
    if (len < 1) {
      return false;
    }
    if (this._length < len) {
      return false;
    }
    const position = this._getPositionByByteOffset(len - 1);
    if (position === null) {
      return false;
    }
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

  _verifyMatch (bufferCollection: BufferCollection, bufferIndex: number, bufferOffset: number, offset: number): boolean {
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

  indexOf (value: number | BufferFromTypes | Buffer | BufferCollection, startOffset: number = 0): number {
    let bufferValue;
    if (value instanceof BufferCollection) {
      bufferValue = value;
    } else if (typeof value === 'number') {
      bufferValue = BufferCollection.from([ value ]);
    } else {
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
    if (position === null) {
      return -1;
    }
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

  lastIndexOf (value: number | BufferFromTypes | Buffer | BufferCollection, startOffset?: number): number {
    let bufferValue;
    if (value instanceof BufferCollection) {
      bufferValue = value;
    } else if (typeof value === 'number') {
      bufferValue = BufferCollection.from([ value ]);
    } else {
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

    const position = this._getPositionByByteOffset(startOffset) as IPosition;
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

  includes (value: string | number | Buffer | BufferCollection, startOffset: number = 0): boolean {
    return this.indexOf(value, startOffset) !== -1;
  }

  fill (value: any, offset: number = 0, end: number | null = null, encoding: BufferEncoding = 'ascii'): BufferCollection {
    if (offset < 0) {
      throw new RangeError('Index out of range');
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
    if (startPosition === null) {
      throw new RangeError('Index out of range');
    }
    let endPosition;
    if (end === null) {
      endPosition = { key: this._bufs.length - 1, offset: this._length };
    } else if (end === this._length) {
      endPosition = { key: this._bufs.length - 1, offset: this._bufs[this._bufs.length - 1].length };
    } else {
      if (end < 0 || end > this._length) {
        throw new RangeError('Index out of range');
      }
      endPosition = this._getPositionByByteOffset(end);
      if (endPosition === null) {
        throw new RangeError('Index out of range');
      }
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

  push (obj: BufferFromTypes | Buffer | BufferCollection): BufferCollection {
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
      const buf = Buffer.from(obj as any);
      if (buf.length > 0) {
        this._bufs.push(buf);
        this._length += buf.length;
      }
    }
    return this;
  }

  // source is the current buffer
  copy (target: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): BufferCollection {
    Buffer.concat(this._bufs).copy(target, targetStart, sourceStart, sourceEnd);
    return this;
  }

  entries (): Iterator<number[]> {
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

  keys (): Iterator<number> {
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

  values (): Iterator<number> {
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
  slice (start: number, end?: number): BufferCollection {
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
    const startPosition = this._getPositionByByteOffset(start) as IPosition;
    let endPosition = this._getPositionByByteOffset(end);
    if (endPosition === null) {
      endPosition = this._getPositionByByteOffset(this._length - 1) as IPosition;
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

  readDoubleBE (offset: number): number {
    return this.slice(offset, offset + 8).toBuffer().readDoubleBE(0);
  }

  readDoubleLE (offset: number): number {
    return this.slice(offset, offset + 8).toBuffer().readDoubleLE(0);
  }

  readFloatBE (offset: number): number {
    return this.slice(offset, offset + 4).toBuffer().readFloatBE(0);
  }

  readFloatLE (offset: number): number {
    return this.slice(offset, offset + 4).toBuffer().readFloatLE(0);
  }

  readUInt8 (offset: number): number {
    if (offset < 0 || offset >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const position = this._getPositionByByteOffset(offset) as IPosition;
    return this._bufs[position.key][position.offset];
  }

  readUInt16BE (offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    return this._bufs[b1.key][b1.offset] * 2 ** 8 + this._bufs[b2.key][b2.offset];
  }

  readUInt16LE (offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    return this._bufs[b1.key][b1.offset] + this._bufs[b2.key][b2.offset] * 2 ** 8;
  }

  readUInt24BE (offset: number): number {
    if (offset < 0 || offset + 2 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] * 2 ** 16 +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset]
    );
  }

  readUInt24LE (offset: number): number {
    if (offset < 0 || offset + 2 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16
    );
  }

  readUInt32BE (offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] * 2 ** 24 +
      this._bufs[b2.key][b2.offset] * 2 ** 16 +
      this._bufs[b3.key][b3.offset] * 2 ** 8 +
      this._bufs[b4.key][b4.offset]
    );
  }

  readUInt32LE (offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24
    );
  }

  readUInt40BE (offset: number): number {
    if (offset < 0 || offset + 4 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] * 2 ** 32 +
      this._bufs[b2.key][b2.offset] * 2 ** 24 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 8 +
      this._bufs[b5.key][b5.offset]
    );
  }

  readUInt40LE (offset: number): number {
    if (offset < 0 || offset + 4 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24 +
      this._bufs[b5.key][b5.offset] * 2 ** 32
    );
  }

  readUInt48BE (offset: number): number {
    if (offset < 0 || offset + 5 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    const b6 = this._incrementPosition(b5) as IPosition;
    return (
      (this._bufs[b1.key][b1.offset] * 2 ** 8 + this._bufs[b2.key][b2.offset]) * 2 ** 32 +
      this._bufs[b3.key][b3.offset] * 2 ** 24 +
      this._bufs[b4.key][b4.offset] * 2 ** 16 +
      this._bufs[b5.key][b5.offset] * 2 ** 8 +
      this._bufs[b6.key][b6.offset]
    );
  }

  readUInt48LE (offset: number): number {
    if (offset < 0 || offset + 5 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    const b6 = this._incrementPosition(b5) as IPosition;
    return (
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24 +
      (this._bufs[b5.key][b5.offset] + this._bufs[b6.key][b6.offset] * 2 ** 8) * 2 ** 32
    );
  }

  readUIntBE (offset: number, byteLength: number): number {
    if (byteLength === 6) { return this.readUInt48BE(offset); }
    if (byteLength === 5) { return this.readUInt40BE(offset); }
    if (byteLength === 3) { return this.readUInt24BE(offset); }
    if (byteLength === 4) { return this.readUInt32BE(offset); }
    if (byteLength === 2) { return this.readUInt16BE(offset); }
    if (byteLength === 1) { return this.readUInt8(offset); }

    throw new RangeError('Bounds error');
  }

  readUIntLE (offset: number, byteLength: number): number {
    if (byteLength === 6) { return this.readUInt48LE(offset); }
    if (byteLength === 5) { return this.readUInt40LE(offset); }
    if (byteLength === 3) { return this.readUInt24LE(offset); }
    if (byteLength === 4) { return this.readUInt32LE(offset); }
    if (byteLength === 2) { return this.readUInt16LE(offset); }
    if (byteLength === 1) { return this.readUInt8(offset); }

    throw new RangeError('Bounds error');
  }

  readInt8 (offset: number): number {
    if (offset < 0 || offset >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const position = this._getPositionByByteOffset(offset) as IPosition;
    const val = this._bufs[position.key][position.offset];
    return val | (val & 2 ** 7) * 0x1fffffe;
  }

  readInt16BE (offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const val = this._bufs[b1.key][b1.offset] * 2 ** 8 + this._bufs[b2.key][b2.offset];
    return val | (val & 2 ** 15) * 0x1fffe;
  }

  readInt16LE (offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const val = this._bufs[b1.key][b1.offset] + this._bufs[b2.key][b2.offset] * 2 ** 8;
    return val | (val & 2 ** 15) * 0x1fffe;
  }

  readInt24BE (offset: number): number {
    if (offset < 0 || offset + 2 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const val =
      this._bufs[b1.key][b1.offset] * 2 ** 16 +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset];
    return val | (val & 2 ** 23) * 0x1fe;
  }

  readInt24LE (offset: number): number {
    if (offset < 0 || offset + 2 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const val =
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16;
    return val | (val & 2 ** 23) * 0x1fe;
  }

  readInt32BE (offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    return (this._bufs[b1.key][b1.offset] << 24) + // Overflow
      this._bufs[b2.key][b2.offset] * 2 ** 16 +
      this._bufs[b3.key][b3.offset] * 2 ** 8 +
      this._bufs[b4.key][b4.offset];
  }

  readInt32LE (offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    return this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      (this._bufs[b4.key][b4.offset] << 24); // Overflow
  }

  readInt40BE (offset: number): number {
    if (offset < 0 || offset + 4 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    return (this._bufs[b1.key][b1.offset] | (this._bufs[b1.key][b1.offset] & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
      this._bufs[b2.key][b2.offset] * 2 ** 24 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 8 +
      this._bufs[b5.key][b5.offset];
  }

  readInt40LE (offset: number): number {
    if (offset < 0 || offset + 4 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    return (this._bufs[b5.key][b5.offset] | (this._bufs[b5.key][b5.offset] & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24;
  }

  readInt48BE (offset: number): number {
    if (offset < 0 || offset + 5 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    const b6 = this._incrementPosition(b5) as IPosition;

    const val = this._bufs[b2.key][b2.offset] + this._bufs[b1.key][b1.offset] * 2 ** 8;
    return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
      this._bufs[b3.key][b3.offset] * 2 ** 24 +
      this._bufs[b4.key][b4.offset] * 2 ** 16 +
      this._bufs[b5.key][b5.offset] * 2 ** 8 +
      this._bufs[b6.key][b6.offset];
  }

  readInt48LE (offset: number): number {
    if (offset < 0 || offset + 5 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    const b5 = this._incrementPosition(b4) as IPosition;
    const b6 = this._incrementPosition(b5) as IPosition;

    const val = this._bufs[b5.key][b5.offset] + this._bufs[b6.key][b6.offset] * 2 ** 8;
    return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
      this._bufs[b1.key][b1.offset] +
      this._bufs[b2.key][b2.offset] * 2 ** 8 +
      this._bufs[b3.key][b3.offset] * 2 ** 16 +
      this._bufs[b4.key][b4.offset] * 2 ** 24;
  }

  readIntBE (offset: number, byteLength: number): number {
    if (byteLength === 6) { return this.readInt48BE(offset); }
    if (byteLength === 5) { return this.readInt40BE(offset); }
    if (byteLength === 3) { return this.readInt24BE(offset); }
    if (byteLength === 4) { return this.readInt32BE(offset); }
    if (byteLength === 2) { return this.readInt16BE(offset); }
    if (byteLength === 1) { return this.readInt8(offset); }

    throw new RangeError('The value of "byteLength" is out of range.');
  }

  readIntLE (offset: number, byteLength: number): number {
    if (byteLength === 6) { return this.readInt48LE(offset); }
    if (byteLength === 5) { return this.readInt40LE(offset); }
    if (byteLength === 3) { return this.readInt24LE(offset); }
    if (byteLength === 4) { return this.readInt32LE(offset); }
    if (byteLength === 2) { return this.readInt16LE(offset); }
    if (byteLength === 1) { return this.readInt8(offset); }

    throw new RangeError('The value of "byteLength" is out of range.');
  }

  write (string: string, offset: number = 0, length?: number, encoding?: BufferEncoding) {
    const data = Buffer.from(string, encoding);
    if (length === undefined) {
      length = Math.min(data.length, this._length - offset);
    }
    this.fill(data, offset, offset + length);
    return data.length;
  }

  writeInt8 (value: number, offset: number): number {
    if (offset < 0 || offset >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const position = this._getPositionByByteOffset(offset) as IPosition;
    this._bufs[position.key][position.offset] = value;
    return offset + 1;
  }

  writeInt16LE (value: number, offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    this._bufs[b1.key][b1.offset] = value;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    return offset + 2;
  }

  writeInt16BE (value: number, offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    this._bufs[b1.key][b1.offset] = value >>> 8;
    this._bufs[b2.key][b2.offset] = value;
    return offset + 2;
  }

  writeInt32LE (value: number, offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    this._bufs[b4.key][b4.offset] = value >>> 24;
    this._bufs[b3.key][b3.offset] = value >>> 16;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    this._bufs[b1.key][b1.offset] = value;
    return offset + 4;
  }

  writeInt32BE (value: number, offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    this._bufs[b1.key][b1.offset] = value >>> 24;
    this._bufs[b2.key][b2.offset] = value >>> 16;
    this._bufs[b3.key][b3.offset] = value >>> 8;
    this._bufs[b4.key][b4.offset] = value;
    return offset + 4;
  }

  _writeBytesLE (value: number, offset: number, byteLength: number, min: number, max: number): number {
    if (value < min || value > max) {
      throw new RangeError(`Out of bounds ${value} ${min} ${max}`);
    }
    if (offset < 0 || offset + byteLength >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }

    const pos = new Array<IPosition>(byteLength);
    pos[0] = this._getPositionByByteOffset(offset) as IPosition;
    for (let i = 1; i < byteLength; i++) {
      pos[i] = this._incrementPosition(pos[i - 1]) as IPosition;
    }

    let newVal = 0;
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

  _writeBytesBE (value: number, offset: number, byteLength: number, min: number, max: number): number {
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

  writeIntBE (value: number, offset: number, byteLength: number): number {
    if (byteLength === 6) { return this._writeBytesBE(value, offset, byteLength, -0x800000000000, 0x7fffffffffff); }
    if (byteLength === 5) { return this._writeBytesBE(value, offset, byteLength, -0x8000000000, 0x7fffffffff); }
    if (byteLength === 3) { return this._writeBytesBE(value, offset, byteLength, -0x800000, 0x7fffff); }
    if (byteLength === 4) { return this._writeBytesBE(value, offset, byteLength, -0x80000000, 0x7fffffff); }
    if (byteLength === 2) { return this._writeBytesBE(value, offset, byteLength, -0x8000, 0x7fff); }
    if (byteLength === 1) { return this._writeBytesBE(value, offset, byteLength, -0x80, 0x7f); }

    throw new RangeError('The value of "byteLength" is out of range.');
  }

  writeUIntBE (value: number, offset: number, byteLength: number): number {
    if (byteLength === 6) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffffffffffff); }
    if (byteLength === 5) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffffffff); }
    if (byteLength === 3) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffff); }
    if (byteLength === 4) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffffffff); }
    if (byteLength === 2) { return this._writeBytesBE(value, offset, byteLength, 0, 0xffff); }
    if (byteLength === 1) { return this._writeBytesBE(value, offset, byteLength, 0, 0xff); }

    throw new RangeError('The value of "byteLength" is out of range.');
  }

  writeIntLE (value: number, offset: number, byteLength: number): number {
    if (byteLength === 6) { return this._writeBytesLE(value, offset, byteLength, -0x800000000000, 0x7fffffffffff); }
    if (byteLength === 5) { return this._writeBytesLE(value, offset, byteLength, -0x8000000000, 0x7fffffffff); }
    if (byteLength === 3) { return this._writeBytesLE(value, offset, byteLength, -0x800000, 0x7fffff); }
    if (byteLength === 4) { return this._writeBytesLE(value, offset, byteLength, -0x80000000, 0x7fffffff); }
    if (byteLength === 2) { return this._writeBytesLE(value, offset, byteLength, -0x8000, 0x7fff); }
    if (byteLength === 1) { return this._writeBytesLE(value, offset, byteLength, -0x80, 0x7f); }

    throw new RangeError('The value of "byteLength" is out of range.');
  }

  writeUIntLE (value: number, offset: number, byteLength: number): number {
    if (byteLength === 6) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffffffffffff); }
    if (byteLength === 5) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffffffff); }
    if (byteLength === 3) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffff); }
    if (byteLength === 4) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffffffff); }
    if (byteLength === 2) { return this._writeBytesLE(value, offset, byteLength, 0, 0xffff); }
    if (byteLength === 1) { return this._writeBytesLE(value, offset, byteLength, 0, 0xff); }

    throw new RangeError('The value of "byteLength" is out of range.');
  }

  writeUInt8 (value: number, offset: number): number {
    if (offset < 0 || offset >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const position = this._getPositionByByteOffset(offset) as IPosition;
    this._bufs[position.key][position.offset] = value;
    return offset + 1;
  }

  writeUInt16LE (value: number, offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    this._bufs[b1.key][b1.offset] = value;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    return offset + 2;
  }

  writeUInt16BE (value: number, offset: number): number {
    if (offset < 0 || offset + 1 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    this._bufs[b1.key][b1.offset] = value >>> 8;
    this._bufs[b2.key][b2.offset] = value;
    return offset + 2;
  }

  writeUInt32LE (value: number, offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    this._bufs[b4.key][b4.offset] = value >>> 24;
    this._bufs[b3.key][b3.offset] = value >>> 16;
    this._bufs[b2.key][b2.offset] = value >>> 8;
    this._bufs[b1.key][b1.offset] = value;
    return offset + 4;
  }

  writeUInt32BE (value: number, offset: number): number {
    if (offset < 0 || offset + 3 >= this._length) {
      throw new RangeError('The value of "offset" is out of range.');
    }
    const b1 = this._getPositionByByteOffset(offset) as IPosition;
    const b2 = this._incrementPosition(b1) as IPosition;
    const b3 = this._incrementPosition(b2) as IPosition;
    const b4 = this._incrementPosition(b3) as IPosition;
    this._bufs[b1.key][b1.offset] = value >>> 24;
    this._bufs[b2.key][b2.offset] = value >>> 16;
    this._bufs[b3.key][b3.offset] = value >>> 8;
    this._bufs[b4.key][b4.offset] = value;
    return offset + 4;
  }

  writeDoubleLE (value: number, offset: number): number {
    this._writeDoubleTempBuffer.writeDoubleLE(value, 0);
    this.fill(this._writeDoubleTempBuffer, offset, offset + 8);
    return offset + 8;
  }

  writeDoubleBE (value: number, offset: number): number {
    this._writeDoubleTempBuffer.writeDoubleBE(value, 0);
    this.fill(this._writeDoubleTempBuffer, offset, offset + 8);
    return offset + 8;
  }

  writeFloatLE (value: number, offset: number): number {
    this._writeFloatTempBuffer.writeFloatLE(value, 0);
    this.fill(this._writeFloatTempBuffer, offset, offset + 4);
    return offset + 4;
  }

  writeFloatBE (value: number, offset: number): number {
    this._writeFloatTempBuffer.writeFloatBE(value, 0,);
    this.fill(this._writeFloatTempBuffer, offset, offset + 4);
    return offset + 4;
  }

  compact (): BufferCollection {
    this._bufs = [Buffer.concat(this._bufs)];
    return this;
  }

  compare (compareTarget: BufferFromTypes | BufferCollection, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number {
    const target = BufferCollection.from(compareTarget);

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

  equals (cmpBuf: Uint8Array): boolean {
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

  /* 
    Returns a string representation of an array.
  */
  toString (encoding?: string, start?: number, end?: number): string {
    let c = 0;
    const _start = start === undefined ? 0 : start;
    const _end = end === undefined ? this._length : end;
    return this._bufs.map((buf) => {
      const s = _start - c;
      const e = _end - c;
      c += buf.length;
      if (e < 0 || s > buf.length) {
        return '';
      }
      return buf.toString(encoding, s, e);
    }).join('');
  }

  inspect (): string {
    const max = 50;
    let str = '';
    str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
    if (this.length > max) {
      str += ' ... ';
    }
    return `<${this.constructor.name} ${str}>`;
  }

  toJSON (): { type: 'Buffer', data: number[] } {
    return {
      type: 'Buffer',
      data: [].concat(...this._bufs.map((buf) => buf.toJSON().data))
    };
  }

  /**
   * Returns a buffer which is the result of concatenating all the buffers in the list together.
   */
  toBuffer (): Buffer {
    return Buffer.concat(this._bufs);
  }

  _getPositionArray (startPos: IPosition, n: number): IPosition[] {
    const arr = new Array(n);
    arr[0] = startPos;
    for (let i = 1; i < n; i++) {
      arr[i] = this._incrementPosition(arr[i - 1]);
    }
    return arr;
  }

  _swapPositions (pos1: IPosition, pos2: IPosition): void {
    const aux = this._bufs[pos1.key][pos1.offset];
    this._bufs[pos1.key][pos1.offset] = this._bufs[pos2.key][pos2.offset];
    this._bufs[pos2.key][pos2.offset] = aux;
  }

  swap16 (): BufferCollection {
    if (this._length % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits');
    }
    if (this.length === 0) {
      return this;
    }
    let pos = this._getPositionByByteOffset(0) as IPosition;

    for (let i = 0; i < this._length; i += 2) {
      const arr = this._getPositionArray(pos, 3);
      this._swapPositions(arr[0], arr[1]);
      pos = arr[2];
    }
    return this;
  }

  swap32 (): BufferCollection {
    if (this._length % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits');
    }
    if (this.length === 0) {
      return this;
    }
    let pos = this._getPositionByByteOffset(0) as IPosition;

    for (let i = 0; i < this._length; i += 4) {
      const arr = this._getPositionArray(pos, 5);
      this._swapPositions(arr[0], arr[3]);
      this._swapPositions(arr[1], arr[2]);
      pos = arr[4];
    }
    return this;
  }

  swap64 (): BufferCollection {
    if (this._length % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits');
    }
    if (this.length === 0) {
      return this;
    }
    let pos = this._getPositionByByteOffset(0) as IPosition;

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
