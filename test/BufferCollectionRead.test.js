'use strict';
/* global test, expect */

const BufferCollection = require('../');

test('read-basic', () => {
  const buf = new BufferCollection();
  buf.push(Buffer.from([0xa4]));
  buf.push(Buffer.from([0xfd]));
  buf.push(Buffer.from([0x48, 0xea]));
  buf.push(Buffer.from([0xcf, 0xff, 0xd9]));
  buf.push(Buffer.from([0x01, 0xde]));

  expect(buf.readDoubleBE(1)).toBe(-3.1827727774563287e+295);
  expect(buf.readDoubleLE(1)).toBe(-6.966010051009108e+144);

  expect(buf.readFloatBE(1)).toBe(-1.6691549692541768e+37);
  expect(buf.readFloatLE(1)).toBe(-7861303808);

  expect(buf.readInt8(1)).toBe(-3);
  expect(buf.readInt8(2)).toBe(72);

  expect(buf.readInt16BE(1)).toBe(-696);
  expect(buf.readInt16BE(2)).toBe(18666);
  expect(buf.readInt16LE(1)).toBe(0x48fd);
  expect(buf.readInt16LE(2)).toBe(-5560);

  expect(buf.readInt32BE(1)).toBe(-45552945);
  expect(buf.readInt32LE(1)).toBe(-806729475);

  expect(buf.readUInt8(1)).toBe(0xfd);

  expect(buf.readUInt16BE(2)).toBe(0x48ea);
  expect(buf.readUInt16LE(2)).toBe(0xea48);

  expect(buf.readUInt32BE(1)).toBe(0xfd48eacf);
  expect(buf.readUInt32LE(1)).toBe(0xcfea48fd);
});

test('read-bytes-dynamic', () => {
  function randInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function makeBuf () {
    const buf = new BufferCollection();
    buf.push(Buffer.from([randInt(0, 255)]));
    buf.push(Buffer.from([randInt(0, 255)]));
    buf.push(Buffer.from([randInt(0, 255), randInt(0, 255)]));
    buf.push(Buffer.from([randInt(0, 255), randInt(0, 255), randInt(0, 255)]));
    buf.push(Buffer.from([randInt(0, 255), randInt(0, 255)]));
    return buf;
  }

  const buf = makeBuf();
  const buf2 = buf.toBuffer();
  for (let i = 1; i <= 6; i++) {
    expect(buf.readIntLE(1, i)).toBe(buf2.readIntLE(1, i));
    expect(buf.readIntBE(1, i)).toBe(buf2.readIntBE(1, i));
    expect(buf.readUIntLE(1, i)).toBe(buf2.readUIntLE(1, i));
    expect(buf.readUIntBE(1, i)).toBe(buf2.readUIntBE(1, i));
  }

  expect(() => buf.readUIntBE(1, 0)).toThrowError();
  expect(() => buf.readUIntBE(1, 7)).toThrowError();

  expect(() => buf.readUIntLE(1, 0)).toThrowError();
  expect(() => buf.readUIntLE(1, 7)).toThrowError();

  expect(() => buf.readIntBE(1, 0)).toThrowError();
  expect(() => buf.readIntBE(1, 7)).toThrowError();

  expect(() => buf.readIntLE(1, 0)).toThrowError();
  expect(() => buf.readIntLE(1, 7)).toThrowError();
});
