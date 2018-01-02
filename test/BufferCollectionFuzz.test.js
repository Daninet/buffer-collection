'use strict';
const N = 1000;
const BufferCollection = require('../');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBuffer(length) {
  const buf = Buffer.alloc(length);
  for (let i = 0; i < length; i++) {
    buf[i] = randInt(0, 255);
  }
  return buf;
}

function makeBuf() {
  const buf = new BufferCollection();
  const numChunks = randInt(0, 15);
  for (let i = 0; i < numChunks; i++) {
    buf.push(randomBuffer(randInt(0, 5)));
  }
  return buf;
}

test('fill', () => {
  for (let i = 0; i < N; i++) {
    const bufCol = makeBuf();
    const buf = bufCol.toBuffer();

    // fill
    let value = [];
    while (!value.length) {
      value = makeBuf().toBuffer().slice(0, randInt(1, 30));
    }
    const offset = randInt(0, buf.length);
    const end = randInt(offset, buf.length);

    bufCol.fill(value, offset, end);
    buf.fill(value, offset, end);

    expect(bufCol.toBuffer().equals(buf)).toBe(true);
  }
});

test('index-of', () => {
  for (let i = 0; i < N; i++) {
    const bufCol = makeBuf();
    const buf = bufCol.toBuffer();

    let needle = BufferCollection.from('');
    while (needle.length === 0 && bufCol.length !== 0) {
      const a = randInt(0, bufCol.length);
      const b = randInt(a, bufCol.length);
      needle = bufCol.slice(a, b);
    }
    expect(bufCol.indexOf(needle)).toBe(buf.indexOf(needle.toBuffer()));

    const i = buf.indexOf(needle.toBuffer());
    expect(bufCol.indexOf(needle, i + 1)).toBe(buf.indexOf(needle.toBuffer(), i + 1));
    expect(bufCol.indexOf(needle, i - 1)).toBe(buf.indexOf(needle.toBuffer(), i - 1));
  }
});

test('last-index-of', () => {
  for (let i = 0; i < N; i++) {
    const bufCol = makeBuf();
    const buf = bufCol.toBuffer();

    let needle = BufferCollection.from('');
    while (needle.length === 0 && bufCol.length !== 0) {
      const a = randInt(0, bufCol.length);
      const b = randInt(a, bufCol.length);
      needle = bufCol.slice(a, b);
    }
    expect(bufCol.lastIndexOf(needle)).toBe(buf.lastIndexOf(needle.toBuffer()));
    expect(bufCol.lastIndexOf(needle, i + 1)).toBe(buf.lastIndexOf(needle.toBuffer(), i + 1));
    expect(bufCol.lastIndexOf(needle, i - 1)).toBe(buf.lastIndexOf(needle.toBuffer(), i - 1));
  }
});

test('slice', () => {
  for (let i = 0; i < N; i++) {
    const bufCol = makeBuf();
    const buf = bufCol.toBuffer();

    const r1 = randInt(-buf.length - 2, buf.length + 2);
    const r2 = randInt(r1, buf.length + 2);

    expect(bufCol.slice(r1).toBuffer().equals(buf.slice(r1))).toBe(true);
    expect(bufCol.slice(r2).toBuffer().equals(buf.slice(r2))).toBe(true);
    expect(bufCol.slice(r1, r2).toBuffer().equals(buf.slice(r1, r2))).toBe(true);
  }
});