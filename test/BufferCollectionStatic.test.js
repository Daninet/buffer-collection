'use strict';

const BufferCollection = require('../');

test('alloc', () => {
  const buf = BufferCollection.alloc(9);
  expect(buf.length).toBe(9);
  expect(buf.count).toBe(1);
  for (const item of buf) {
    expect(item).toBe(0);
  }

  const buf2 = BufferCollection.alloc(9, 240);
  expect(buf2.length).toBe(9);
  expect(buf2.count).toBe(1);
  for (const item of buf2) {
    expect(item).toBe(240);
  }
});

test('alloc-unsafe', () => {
  const buf = BufferCollection.allocUnsafe(9);
  expect(buf.length).toBe(9);
  expect(buf.count).toBe(1);
});

test('alloc-unsafe-slow', () => {
  const buf = BufferCollection.allocUnsafeSlow(9);
  expect(buf.length).toBe(9);
  expect(buf.count).toBe(1);
});

test('byte-length', () => {
  expect(BufferCollection.byteLength('Iñtërnâtiônàlizætiøn')).toBe(Buffer.byteLength('Iñtërnâtiônàlizætiøn'));
});

test('is-buffer', () => {
  expect(BufferCollection.isBuffer(Buffer.alloc(1))).toBe(true);
  expect(BufferCollection.isBuffer(BufferCollection.alloc(1))).toBe(true);
  expect(BufferCollection.isBuffer([1])).toBe(false);
});

test('concat', () => {
  expect(
    BufferCollection.concat([])
      .toBuffer()
      .equals(Buffer.from([])))
    .toBe(true);
  expect(BufferCollection.concat([]).count).toBe(0);
  expect(BufferCollection.concat([]).length).toBe(0);
  expect(
    BufferCollection.concat([Buffer.from([0, 1]), Buffer.from([2]), Buffer.from([3])])
      .toBuffer()
      .equals(Buffer.from([0, 1, 2, 3])))
    .toBe(true);
  expect(
    BufferCollection.concat([BufferCollection.from([0, 1]), BufferCollection.from([2]), BufferCollection.from([3])])
      .toBuffer()
      .equals(Buffer.from([0, 1, 2, 3])))
    .toBe(true);
  expect(BufferCollection.concat([Buffer.from([0, 1])]).count).toBe(1);
  expect(BufferCollection.concat([Buffer.from([0, 1]), Buffer.from([2, 3])]).count).toBe(2);
  expect(BufferCollection.concat([Buffer.from([0, 1, 2])]).length).toBe(3);
});

test('concat-total-length', () => {
  const bufferArr = [Buffer.from([1, 2]), Buffer.from([3, 4]), Buffer.from([5, 6, 7])];
  let buf = BufferCollection.concat(bufferArr, 3);
  expect(buf.toBuffer().equals(Buffer.from([1, 2, 3]))).toBe(true);
  expect(buf.length).toBe(3);
  expect(buf.count).toBe(2);

  buf = BufferCollection.concat(bufferArr, 0);
  expect(buf.toBuffer().equals(Buffer.from([]))).toBe(true);
  expect(buf.length).toBe(0);
  expect(buf.count).toBe(0);

  buf = BufferCollection.concat(bufferArr, 2);
  expect(buf.toBuffer().equals(Buffer.from([1, 2]))).toBe(true);
  expect(buf.length).toBe(2);
  expect(buf.count).toBe(1);
});


test('is-encoding', () => {
  expect(BufferCollection.isEncoding('utf8')).toBe(true);
  expect(BufferCollection.isEncoding('utf-8')).toBe(true);
  expect(BufferCollection.isEncoding('utf-9')).toBe(false);
});

test('pool-size', () => {
  expect(BufferCollection.poolSize).toBe(Buffer.poolSize);
});