import BufferCollection from '../lib/BufferCollection';
/* global test, expect */

const exponents = [1, 2 ** 8, 2 ** 16, 2 ** 24, 2 ** 32];
const binaryCalc = (...args: number[]) => {
  let sum = 0;
  if (args.length === 6) {
    args[1] += args[0] * exponents[1];
    args.shift();
  }
  for (let i = 0; i < args.length; i++) {
    sum += args[i] * exponents[args.length - 1 - i];
  }
  return sum;
};

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

test('read uint', () => {
  const buf = new BufferCollection();
  buf.push([1, 2]).push([3, 4, 5]).push([6, 7, 8]);

  expect(() => buf.readUInt8(-1)).toThrowError();
  expect(buf.readUInt8(0)).toBe(1);
  expect(buf.readUInt8(7)).toBe(8);
  expect(() => buf.readUInt8(8)).toThrowError();

  expect(() => buf.readUInt16BE(-1)).toThrowError();
  expect(buf.readUInt16BE(0)).toBe(binaryCalc(1, 2));
  expect(buf.readUInt16BE(6)).toBe(binaryCalc(7, 8));
  expect(() => buf.readUInt16BE(7)).toThrowError();

  expect(() => buf.readUInt16LE(-1)).toThrowError();
  expect(buf.readUInt16LE(0)).toBe(binaryCalc(2, 1));
  expect(buf.readUInt16LE(6)).toBe(binaryCalc(8, 7));
  expect(() => buf.readUInt16LE(7)).toThrowError();

  expect(() => buf.readUInt24BE(-1)).toThrowError();
  expect(buf.readUInt24BE(0)).toBe(binaryCalc(1, 2, 3));
  expect(buf.readUInt24BE(5)).toBe(binaryCalc(6, 7, 8));
  expect(() => buf.readUInt24BE(6)).toThrowError();

  expect(() => buf.readUInt24LE(-1)).toThrowError();
  expect(buf.readUInt24LE(0)).toBe(binaryCalc(3, 2, 1));
  expect(buf.readUInt24LE(5)).toBe(binaryCalc(8, 7, 6));
  expect(() => buf.readUInt24LE(6)).toThrowError();

  expect(() => buf.readUInt32BE(-1)).toThrowError();
  expect(buf.readUInt32BE(0)).toBe(binaryCalc(1, 2, 3, 4));
  expect(buf.readUInt32BE(4)).toBe(binaryCalc(5, 6, 7, 8));
  expect(() => buf.readUInt32BE(5)).toThrowError();

  expect(() => buf.readUInt32LE(-1)).toThrowError();
  expect(buf.readUInt32LE(0)).toBe(binaryCalc(4, 3, 2, 1));
  expect(buf.readUInt32LE(4)).toBe(binaryCalc(8, 7, 6, 5));
  expect(() => buf.readUInt32LE(5)).toThrowError();

  expect(() => buf.readUInt40BE(-1)).toThrowError();
  expect(buf.readUInt40BE(0)).toBe(binaryCalc(1, 2, 3, 4, 5));
  expect(buf.readUInt40BE(3)).toBe(binaryCalc(4, 5, 6, 7, 8));
  expect(() => buf.readUInt40BE(4)).toThrowError();

  expect(() => buf.readUInt40LE(-1)).toThrowError();
  expect(buf.readUInt40LE(0)).toBe(binaryCalc(5, 4, 3, 2, 1));
  expect(buf.readUInt40LE(3)).toBe(binaryCalc(8, 7, 6, 5, 4));
  expect(() => buf.readUInt40LE(4)).toThrowError();

  expect(() => buf.readUInt48BE(-1)).toThrowError();
  expect(buf.readUInt48BE(0)).toBe(binaryCalc(1, 2, 3, 4, 5, 6));
  expect(buf.readUInt48BE(2)).toBe(binaryCalc(3, 4, 5, 6, 7, 8));
  expect(() => buf.readUInt48BE(3)).toThrowError();

  expect(() => buf.readUInt48LE(-1)).toThrowError();
  expect(buf.readUInt48LE(0)).toBe(binaryCalc(6, 5, 4, 3, 2, 1));
  expect(buf.readUInt48LE(2)).toBe(binaryCalc(8, 7, 6, 5, 4, 3));
  expect(() => buf.readUInt48LE(3)).toThrowError();
});

test('read int', () => {
  const buf = new BufferCollection();
  buf.push([1, 2]).push([3, 4, 5]).push([6, 7, 8]);

  expect(() => buf.readInt8(-1)).toThrowError();
  expect(buf.readInt8(0)).toBe(1);
  expect(buf.readInt8(7)).toBe(8);
  expect(() => buf.readInt8(8)).toThrowError();

  expect(() => buf.readInt16BE(-1)).toThrowError();
  expect(buf.readInt16BE(0)).toBe(binaryCalc(1, 2));
  expect(buf.readInt16BE(6)).toBe(binaryCalc(7, 8));
  expect(() => buf.readInt16BE(7)).toThrowError();

  expect(() => buf.readInt16LE(-1)).toThrowError();
  expect(buf.readInt16LE(0)).toBe(binaryCalc(2, 1));
  expect(buf.readInt16LE(6)).toBe(binaryCalc(8, 7));
  expect(() => buf.readInt16LE(7)).toThrowError();

  expect(() => buf.readInt24BE(-1)).toThrowError();
  expect(buf.readInt24BE(0)).toBe(binaryCalc(1, 2, 3));
  expect(buf.readInt24BE(5)).toBe(binaryCalc(6, 7, 8));
  expect(() => buf.readInt24BE(6)).toThrowError();

  expect(() => buf.readInt24LE(-1)).toThrowError();
  expect(buf.readInt24LE(0)).toBe(binaryCalc(3, 2, 1));
  expect(buf.readInt24LE(5)).toBe(binaryCalc(8, 7, 6));
  expect(() => buf.readInt24LE(6)).toThrowError();

  expect(() => buf.readInt32BE(-1)).toThrowError();
  expect(buf.readInt32BE(0)).toBe(binaryCalc(1, 2, 3, 4));
  expect(buf.readInt32BE(4)).toBe(binaryCalc(5, 6, 7, 8));
  expect(() => buf.readInt32BE(5)).toThrowError();

  expect(() => buf.readInt32LE(-1)).toThrowError();
  expect(buf.readInt32LE(0)).toBe(binaryCalc(4, 3, 2, 1));
  expect(buf.readInt32LE(4)).toBe(binaryCalc(8, 7, 6, 5));
  expect(() => buf.readInt32LE(5)).toThrowError();

  expect(() => buf.readInt40BE(-1)).toThrowError();
  expect(buf.readInt40BE(0)).toBe(binaryCalc(1, 2, 3, 4, 5));
  expect(buf.readInt40BE(3)).toBe(binaryCalc(4, 5, 6, 7, 8));
  expect(() => buf.readInt40BE(4)).toThrowError();

  expect(() => buf.readInt40LE(-1)).toThrowError();
  expect(buf.readInt40LE(0)).toBe(binaryCalc(5, 4, 3, 2, 1));
  expect(buf.readInt40LE(3)).toBe(binaryCalc(8, 7, 6, 5, 4));
  expect(() => buf.readInt40LE(4)).toThrowError();

  expect(() => buf.readInt48BE(-1)).toThrowError();
  expect(buf.readInt48BE(0)).toBe(binaryCalc(1, 2, 3, 4, 5, 6));
  expect(buf.readInt48BE(2)).toBe(binaryCalc(3, 4, 5, 6, 7, 8));
  expect(() => buf.readInt48BE(3)).toThrowError();

  expect(() => buf.readInt48LE(-1)).toThrowError();
  expect(buf.readInt48LE(0)).toBe(binaryCalc(6, 5, 4, 3, 2, 1));
  expect(buf.readInt48LE(2)).toBe(binaryCalc(8, 7, 6, 5, 4, 3));
  expect(() => buf.readInt48LE(3)).toThrowError();
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
    expect(() => buf.readIntLE(-1, i)).toThrowError();
    expect(() => buf.readIntBE(-1, i)).toThrowError();
    expect(() => buf.readUIntLE(-1, i)).toThrowError();
    expect(() => buf.readUIntBE(-1, i)).toThrowError();
    expect(buf.readIntLE(1, i)).toBe(buf2.readIntLE(1, i));
    expect(buf.readIntBE(1, i)).toBe(buf2.readIntBE(1, i));
    expect(buf.readUIntLE(1, i)).toBe(buf2.readUIntLE(1, i));
    expect(buf.readUIntBE(1, i)).toBe(buf2.readUIntBE(1, i));
    expect(() => buf.readIntLE(buf.length - i, i)).not.toThrowError();
    expect(() => buf.readIntBE(buf.length - i, i)).not.toThrowError();
    expect(() => buf.readUIntLE(buf.length - i, i)).not.toThrowError();
    expect(() => buf.readUIntBE(buf.length - i, i)).not.toThrowError();
    expect(() => buf.readIntLE(buf.length - i + 1, i)).toThrowError();
    expect(() => buf.readIntBE(buf.length - i + 1, i)).toThrowError();
    expect(() => buf.readUIntLE(buf.length - i + 1, i)).toThrowError();
    expect(() => buf.readUIntBE(buf.length - i + 1, i)).toThrowError();
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
