'use strict';

const BufferCollection = require('../');

test('write-basic', () => {
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