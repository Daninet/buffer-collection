'use strict';

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