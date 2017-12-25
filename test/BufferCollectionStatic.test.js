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

test('is-encoding', () => {
  expect(BufferCollection.isEncoding('utf8')).toBe(true);
  expect(BufferCollection.isEncoding('utf-8')).toBe(true);
  expect(BufferCollection.isEncoding('utf-9')).toBe(false);
});

test('pool-size', () => {
  expect(BufferCollection.poolSize).toBe(Buffer.poolSize);
});