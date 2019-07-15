import BufferCollection from '../lib/BufferCollection';
/* global test, expect */

test('write-simple', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('12345');

  buf.write('po');
  expect(buf.toString()).toBe('pocdxy12345');
  buf.write('AB', 3);
  expect(buf.toString()).toBe('pocABy12345');
  buf.write('XZ', 4, 1);
  expect(buf.toString()).toBe('pocAXy12345');
  buf.write('II', 6, 0);
  expect(buf.toString()).toBe('pocAXy12345');
  buf.write('TR0', 9);
  expect(buf.toString()).toBe('pocAXy123TR');
});

test('write-bytes', () => {
  function makeBuf () {
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

test('write-bytes-dynamic', () => {
  function makeBuf () {
    const buf = new BufferCollection();
    buf.push(Buffer.alloc(1));
    buf.push(Buffer.alloc(1));
    buf.push(Buffer.alloc(2));
    buf.push(Buffer.alloc(3));
    buf.push(Buffer.alloc(2));
    return buf;
  }

  let buf = makeBuf();
  let buf2 = Buffer.alloc(9);
  for (let i = 1; i <= 6; i++) {
    expect(buf.writeIntLE(1, 1, i)).toBe(buf2.writeIntLE(1, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeIntBE(1, 1, i)).toBe(buf2.writeIntBE(1, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeIntLE(-1, 1, i)).toBe(buf2.writeIntLE(-1, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeIntBE(-1, 1, i)).toBe(buf2.writeIntBE(-1, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeUIntLE(1, 1, i)).toBe(buf2.writeUIntLE(1, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeUIntBE(1, 1, i)).toBe(buf2.writeUIntBE(1, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
  }

  let val = 0x12;
  for (let i = 1; i <= 6; i++) {
    expect(buf.writeIntLE(val, 1, i)).toBe(buf2.writeIntLE(val, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeIntBE(val, 1, i)).toBe(buf2.writeIntBE(val, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeIntLE(-val, 1, i)).toBe(buf2.writeIntLE(-val, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeIntBE(-val, 1, i)).toBe(buf2.writeIntBE(-val, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeUIntLE(val, 1, i)).toBe(buf2.writeUIntLE(val, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    expect(buf.writeUIntBE(val, 1, i)).toBe(buf2.writeUIntBE(val, 1, i));
    expect(buf.toBuffer().equals(buf2)).toBe(true);
    val = val * 256 + 0x56;
  }

  expect(() => buf.writeUIntBE(256, 1, 1)).toThrowError();
  expect(() => buf.writeUIntLE(256, 1, 1)).toThrowError();

  expect(() => buf.writeUIntBE(1, 1, 0)).toThrowError();
  expect(() => buf.writeUIntBE(1, 1, 7)).toThrowError();

  expect(() => buf.writeUIntLE(1, 1, 0)).toThrowError();
  expect(() => buf.writeUIntLE(1, 1, 7)).toThrowError();

  expect(() => buf.writeIntBE(1, 1, 0)).toThrowError();
  expect(() => buf.writeIntBE(1, 1, 7)).toThrowError();

  expect(() => buf.writeIntLE(1, 1, 0)).toThrowError();
  expect(() => buf.writeIntLE(1, 1, 7)).toThrowError();
});
