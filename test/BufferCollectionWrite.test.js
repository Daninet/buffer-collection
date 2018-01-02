'use strict';

const BufferCollection = require('../');

test('write-simple', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('12345');

  buf.write('po')
  expect(buf.toString()).toBe('pocdxy12345');
  buf.write('AB', 3)
  expect(buf.toString()).toBe('pocABy12345');
  buf.write('XZ', 4, 1)
  expect(buf.toString()).toBe('pocAXy12345');
  buf.write('II', 6, 0)
  expect(buf.toString()).toBe('pocAXy12345');
  buf.write('TR0', 9)
  expect(buf.toString()).toBe('pocAXy123TR');
});

test('write-bytes', () => {
  function makeBuf() {
    const buf = new BufferCollection();
    buf.push(Buffer.alloc(1));
    buf.push(Buffer.alloc(1));
    buf.push(Buffer.alloc(2));
    buf.push(Buffer.alloc(3));
    buf.push(Buffer.alloc(2));
    return buf;
  }

  let buf = makeBuf();
  expect(buf.writeFloatBE(1, 1)).toBe(5);
  expect(buf.toBuffer().equals(Buffer.from([0, 63, 128, 0, 0, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeFloatLE(1, 1)).toBe(5);
  expect(buf.toBuffer().equals(Buffer.from([0, 0, 0, 128, 63, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeDoubleBE(1, 1)).toBe(9);
  expect(buf.toBuffer().equals(Buffer.from([0, 63, 240, 0, 0, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeDoubleLE(1, 1)).toBe(9);
  expect(buf.toBuffer().equals(Buffer.from([0, 0, 0, 0, 0, 0, 0, 240, 63]))).toBe(true);
  
  buf = makeBuf();
  expect(buf.writeInt8(1, 0)).toBe(1);
  expect(buf.toBuffer().equals(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);

  buf = makeBuf();
  expect(buf.writeInt16BE(1, 1)).toBe(3);
  expect(buf.toBuffer().equals(Buffer.from([0, 0, 1, 0, 0, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeInt16LE(1, 1)).toBe(3);
  expect(buf.toBuffer().equals(Buffer.from([0, 1, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);

  expect(buf.writeInt32BE(1, 1)).toBe(5);
  expect(buf.toBuffer().equals(Buffer.from([0, 0, 0, 0, 1, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeInt32LE(1, 1)).toBe(5);
  expect(buf.toBuffer().equals(Buffer.from([0, 1, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);

  buf = makeBuf();
  expect(buf.writeUInt8(1, 0)).toBe(1);
  expect(buf.toBuffer().equals(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);

  buf = makeBuf();
  expect(buf.writeUInt16BE(1, 1)).toBe(3);
  expect(buf.toBuffer().equals(Buffer.from([0, 0, 1, 0, 0, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeUInt16LE(1, 1)).toBe(3);
  expect(buf.toBuffer().equals(Buffer.from([0, 1, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);

  expect(buf.writeUInt32BE(1, 1)).toBe(5);
  expect(buf.toBuffer().equals(Buffer.from([0, 0, 0, 0, 1, 0, 0, 0, 0]))).toBe(true);
  expect(buf.writeUInt32LE(1, 1)).toBe(5);
  expect(buf.toBuffer().equals(Buffer.from([0, 1, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);
});