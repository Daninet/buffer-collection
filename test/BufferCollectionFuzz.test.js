'use strict';

const BufferCollection = require('../');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBuffer(length) {
  const buf = Buffer.alloc(length);
  for (let i = 0; i<length; i++) {
    buf[i] = randInt(0, 255);
  }
  return buf;
}

function makeBuf() {
  const buf = new BufferCollection();
  const numChunks = randInt(0, 10);
  for (let i = 0; i < numChunks; i++) {
    buf.push(randomBuffer(randInt(0, 3)));
  }
  return buf;
}

test('fill', () => {
  /*for (let i = 0; i<20; i++) {
    let bufCol = makeBuf();
    let buf = bufCol.toBuffer();

    // fill 
    const value = makeBuf().toBuffer().slice(0, randInt(0, 30));
    const offset = randInt(0, buf.length - 1);
    const end = randInt(offset, buf.length);

    bufCol.fill(value, offset, end);
    buf.fill(value, offset, end);

    expect(bufCol.toBuffer().equals(buf)).toBe(true);
  }*/
});