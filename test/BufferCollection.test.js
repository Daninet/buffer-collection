'use strict';

const BufferCollection = require('../');

test('get-position-by-byte-offset', () => {
  const buf = new BufferCollection();
  expect(buf._getPositionByByteOffset(0)).toBe(null);
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('abcd');
  expect(buf._getPositionByByteOffset(0)).toEqual({key: 0, offset: 0});
  expect(buf._getPositionByByteOffset(3)).toEqual({key: 0, offset: 3});
  expect(buf._getPositionByByteOffset(4)).toEqual({key: 1, offset: 0});
  expect(buf._getPositionByByteOffset(5)).toEqual({key: 2, offset: 0});
  expect(buf._getPositionByByteOffset(6)).toEqual({key: 3, offset: 0});
  expect(buf._getPositionByByteOffset(7)).toEqual({key: 3, offset: 1});
  expect(buf._getPositionByByteOffset(9)).toEqual({key: 3, offset: 3});
  expect(buf._getPositionByByteOffset(10)).toBe(null);
  const buf2 = new BufferCollection();
  buf2.push('x');
  expect(buf2._getPositionByByteOffset(0)).toEqual({key: 0, offset: 0});
  expect(buf2._getPositionByByteOffset(1)).toBe(null);
});

test('increment-position', () => {
  const buf = new BufferCollection();
  buf.push('abc');
  buf.push('x');
  buf.push('y');
  buf.push('12');
  let position = buf._getPositionByByteOffset(0);
  expect(position).toEqual({key: 0, offset: 0});
  position = buf._incrementPosition(position);
  expect(position).toEqual({key: 0, offset: 1});
  position = buf._incrementPosition(position);
  expect(position).toEqual({key: 0, offset: 2});
  position = buf._incrementPosition(position);
  expect(position).toEqual({key: 1, offset: 0});
  position = buf._incrementPosition(position);
  expect(position).toEqual({key: 2, offset: 0});
  position = buf._incrementPosition(position);
  expect(position).toEqual({key: 3, offset: 0});
  position = buf._incrementPosition(position);
  expect(position).toEqual({key: 3, offset: 1});
  position = buf._incrementPosition(position);
  expect(position).toBe(null);
  position = buf._incrementPosition(position);
  expect(position).toBe(null);
});


test('simple-read', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  expect(buf.read(0)).toBe(false);
  expect(buf.read(1).toString()).toBe('a');
  expect(buf.read(1).toString()).toBe('b');
  expect(buf.read(1).toString()).toBe('c');
  expect(buf.read(1).toString()).toBe('d');
  expect(buf.read(1)).toBe(false);
});

test('complex-read', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  expect(buf.read(1).toString()).toBe('a');
  expect(buf.length).toBe(3);
  expect(buf.count).toBe(1);
  expect(buf.read(1).toString()).toBe('b');
  expect(buf.length).toBe(2);
  expect(buf.count).toBe(1);
  expect(buf.read(3)).toBe(false);
  expect(buf.length).toBe(2);
  expect(buf.count).toBe(1);
  buf.push('e');
  buf.push('fgh');
  buf.push('i');
  expect(buf.length).toBe(7);
  expect(buf.count).toBe(4);
  expect(buf.read(8)).toBe(false);
  expect(buf.read(7).toString()).toBe('cdefghi');
  expect(buf.length).toBe(0);
  expect(buf.count).toBe(0);
  expect(buf.read(1)).toBe(false);
  buf.push('x');
  expect(buf.read(1).toString()).toBe('x');
  expect(buf.length).toBe(0);
  expect(buf.count).toBe(0);
});

test('simple-push', () => {
  const buf = new BufferCollection();
  expect(buf.length).toBe(0);
  expect(buf.count).toBe(0);
  buf.push('abcdef');
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(1);
  buf.push('g');
  expect(buf.length).toBe(7);
  expect(buf.count).toBe(2);
  expect(buf.read(7).toString()).toBe('abcdefg');
  expect(buf.length).toBe(0);
  expect(buf.count).toBe(0);
});

test('shift-buffer', () => {
  const buf = new BufferCollection();
  buf.push('abcdef');
  buf.push('g');
  buf.push('123');
  expect(buf.shiftBuffer().toString()).toBe('abcdef');
  expect(buf.count).toBe(2);
  expect(buf.shiftBuffer().toString()).toBe('g');
  expect(buf.count).toBe(1);
  expect(buf.shiftBuffer().toString()).toBe('123');
  expect(buf.count).toBe(0);
  expect(buf.shiftBuffer()).toBe(undefined);
  expect(buf.count).toBe(0);
});

test('push-types', () => {
  const buf = new BufferCollection();
  buf.push(Buffer.from('abcdef'));
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(1);
  expect(buf.toString()).toBe('abcdef');
  buf.push('g');
  expect(buf.length).toBe(7);
  expect(buf.count).toBe(2);
  expect(buf.toString()).toBe('abcdefg');
  const buf2 = new BufferCollection();
  buf2.push('12');
  buf2.push('3');
  buf2.push('456');
  buf.push(buf2);
  expect(buf.length).toBe(13);
  expect(buf.count).toBe(5);
  expect(buf.toString()).toBe('abcdefg123456');
});

test('verify-match', () => {
  const buf = new BufferCollection();
  buf.push('abcdef');
  buf.push('g');
  expect(buf._verifyMatch(Buffer.from('cd'), 0, 2, 2)).toBe(true);
  expect(buf._verifyMatch(Buffer.from('cdef'), 0, 2, 2)).toBe(true);
  expect(buf._verifyMatch(Buffer.from('cdefg'), 0, 2, 2)).toBe(true);
  expect(buf._verifyMatch(Buffer.from('cd'), 0, 1, 2)).toBe(false);
  expect(buf._verifyMatch(Buffer.from('g'), 1, 0, 6)).toBe(true);
  buf.push('h12345');
  expect(buf._verifyMatch(Buffer.from('cdefgh12'), 0, 2, 2)).toBe(true);
  expect(buf._verifyMatch(Buffer.from('cdefg112'), 0, 2, 2)).toBe(false);
  expect(buf._verifyMatch(Buffer.from('cdefgh12345'), 0, 2, 2)).toBe(true);
  expect(buf._verifyMatch(Buffer.from('cdefgh123456asdfasdf'), 0, 2, 2)).toBe(false);
  const buf2 = new BufferCollection();
  buf2.push('abcdd');
  buf2.push('xdfdf');
  expect(buf2._verifyMatch(Buffer.from('dx'), 1, 0, 5)).toBe(false);
  expect(buf2._verifyMatch(Buffer.from('dx'), 0, 4, 4)).toBe(true);
  expect(buf2._verifyMatch(Buffer.from('dx'), 0, 3, 3)).toBe(false);
});


test('index-of-simple', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  expect(buf.indexOf('x')).toBe(-1);
  expect(buf.indexOf('a')).toBe(0);
  expect(buf.indexOf('d')).toBe(3);
  expect(buf.indexOf('ac')).toBe(-1);
  expect(buf.indexOf('cd')).toBe(2);
  expect(buf.indexOf('cda')).toBe(-1);
  buf.push('xdfdf');
  expect(buf.indexOf('dx')).toBe(3);
  expect(buf.indexOf('dxdfdf')).toBe(3);
  expect(buf.indexOf('dxdfdfx')).toBe(-1);
  expect(buf.indexOf('xdfdf')).toBe(4);
  buf.push('u');
  buf.push('v');
  buf.push('z');
  buf.push('1');
  expect(buf.indexOf('fuvz')).toBe(8);
  expect(buf.indexOf('fuvz1')).toBe(8);
  expect(buf.indexOf('fuvz11')).toBe(-1);
});

test('index-of-bad-param', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  expect(buf.indexOf('abcdabcd')).toBe(-1);
  expect(buf.indexOf('a', -1)).toBe(-1);
  expect(buf.indexOf('a', 1)).toBe(-1);
  expect(buf.indexOf('a', 4)).toBe(-1);
});

test('index-of-position', () => {
  const buf = new BufferCollection();
  buf.push('abcdxy');
  buf.push('x');
  buf.push('y');
  buf.push('abcd');
  expect(buf.indexOf('cd')).toBe(2);
  expect(buf.indexOf('cd', 3)).toBe(10);
  expect(buf.indexOf('yx', 0)).toBe(5);
  expect(buf.indexOf('xya', 0)).toBe(6);
  expect(buf.indexOf('xya', 1)).toBe(6);
  expect(buf.indexOf('xy', 1)).toBe(4);
  expect(buf.indexOf('xy', 3)).toBe(4);
  expect(buf.indexOf('xy', 4)).toBe(4);
  expect(buf.indexOf('xy', 5)).toBe(6);
  expect(buf.indexOf('xy', 7)).toBe(-1);
});

test('last-index-of', () => {
  const buf = new BufferCollection();
  buf.push('abcdd');
  expect(buf.lastIndexOf('x')).toBe(-1);
  expect(buf.lastIndexOf('a')).toBe(0);
  expect(buf.lastIndexOf('d')).toBe(4);
  expect(buf.lastIndexOf('d', 3)).toBe(3);
  expect(buf.lastIndexOf('d', 2)).toBe(-1);
  expect(buf.lastIndexOf('ac')).toBe(-1);
  expect(buf.lastIndexOf('cd')).toBe(2);
  expect(buf.lastIndexOf('cda')).toBe(-1);
  buf.push('xdfdfa');
  expect(buf.lastIndexOf('dx')).toBe(4);
  expect(buf.lastIndexOf('dxdfdf')).toBe(4);
  expect(buf.lastIndexOf('dxdfdfx')).toBe(-1);
  expect(buf.lastIndexOf('xdfdf')).toBe(5);
  buf.push('b');
  buf.push('c');
  buf.push('1');
  expect(buf.lastIndexOf('abc')).toBe(10);
  expect(buf.lastIndexOf('abc', 11)).toBe(10);
  expect(buf.lastIndexOf('abc', 10)).toBe(10);
  expect(buf.lastIndexOf('abc', 9)).toBe(0);
  expect(buf.lastIndexOf('abc', 3)).toBe(0);
  expect(buf.lastIndexOf('abc', 0)).toBe(0);
});

test('last-index-of-bad-param', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  expect(buf.lastIndexOf('abcdabcd')).toBe(-1);
  expect(buf.lastIndexOf('a', -1)).toBe(-1);
  expect(buf.lastIndexOf('c', 2)).toBe(2);
  expect(buf.lastIndexOf('c', 1)).toBe(-1);
});

test('includes', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  expect(buf.includes('x')).toBe(false);
  expect(buf.includes('a')).toBe(true);
  expect(buf.includes('d')).toBe(true);
  expect(buf.includes('ac')).toBe(false);
  expect(buf.includes('cd')).toBe(true);
  expect(buf.includes('cda')).toBe(false);
  buf.push('xdfdf');
  expect(buf.includes('dx')).toBe(true);
  expect(buf.includes('dxdfdf')).toBe(true);
  expect(buf.includes('dxdfdfx')).toBe(false);
  expect(buf.includes('xdfdf')).toBe(true);
  buf.push('u');
  buf.push('v');
  buf.push('z');
  buf.push('1');
  expect(buf.includes('fuvz')).toBe(true);
  expect(buf.includes('fuvz1')).toBe(true);
  expect(buf.includes('fuvz11')).toBe(false);
});

test('compact', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(3);
  buf.compact();
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(1);
  expect(buf.read(6).toString()).toBe('abcdxy');
});

test('fill', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('12345678');
  buf.fill('0');
  expect(buf.length).toBe(14);
  expect(buf.count).toBe(4);
  expect(buf.toString()).toBe('00000000000000');
  buf.fill('abc');
  expect(buf.toString()).toBe('abcabcabcabcab');
  buf.fill('abcabcabcabcabcabcabcabc');
  expect(buf.toString()).toBe('abcabcabcabcab');
  buf.fill('12345', 2);
  expect(buf.toString()).toBe('ab123451234512');
  buf.fill('xy', 4, 9);
  expect(buf.toString()).toBe('ab12xyxyx34512');
  buf.fill('xy', 11, 14);
  expect(buf.toString()).toBe('ab12xyxyx34xyx');  
});

test('copy', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('12345678');
  const buf2 = Buffer.alloc(15).fill('o');
  buf.copy(buf2, 2, 3, 11);
  expect(buf2.toString()).toBe('oodxy12345ooooo');
});

test('slice', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('123');
  expect(buf.slice(0, 0).toString()).toBe('');
  expect(buf.slice(0, 1).toString()).toBe('a');
  expect(buf.slice(0, 9).toString()).toBe('abcdxy123');
  expect(buf.slice(0).toString()).toBe('abcdxy123');
  expect(buf.slice(2, 3).toString()).toBe('c');
  expect(buf.slice(5, 7).toString()).toBe('y1');
  expect(buf.slice(3).toString()).toBe('dxy123');
});

test('entries', () => {
  const buf = new BufferCollection();
  buf.push('abc');
  buf.push('x');
  buf.push('12');
  const entries = buf.entries();
  expect(entries.next()).toEqual({value: [0, 'a'.charCodeAt(0)], done: false});
  expect(entries.next()).toEqual({value: [1, 'b'.charCodeAt(0)], done: false});
  expect(entries.next()).toEqual({value: [2, 'c'.charCodeAt(0)], done: false});
  expect(entries.next()).toEqual({value: [3, 'x'.charCodeAt(0)], done: false});
  expect(entries.next()).toEqual({value: [4, '1'.charCodeAt(0)], done: false});
  expect(entries.next()).toEqual({value: [5, '2'.charCodeAt(0)], done: false});
  expect(entries.next()).toEqual({value: undefined, done: true});
});

test('keys', () => {
  const buf = new BufferCollection();
  buf.push('abc');
  buf.push('x');
  buf.push('12');
  const entries = buf.keys();
  expect(entries.next()).toEqual({value: 0, done: false});
  expect(entries.next()).toEqual({value: 1, done: false});
  expect(entries.next()).toEqual({value: 2, done: false});
  expect(entries.next()).toEqual({value: 3, done: false});
  expect(entries.next()).toEqual({value: 4, done: false});
  expect(entries.next()).toEqual({value: 5, done: false});
  expect(entries.next()).toEqual({value: undefined, done: true});
});

test('values', () => {
  const buf = new BufferCollection();
  buf.push('abc');
  buf.push('x');
  buf.push('12');
  const entries = buf.values();
  expect(entries.next()).toEqual({value: 'a'.charCodeAt(0), done: false});
  expect(entries.next()).toEqual({value: 'b'.charCodeAt(0), done: false});
  expect(entries.next()).toEqual({value: 'c'.charCodeAt(0), done: false});
  expect(entries.next()).toEqual({value: 'x'.charCodeAt(0), done: false});
  expect(entries.next()).toEqual({value: '1'.charCodeAt(0), done: false});
  expect(entries.next()).toEqual({value: '2'.charCodeAt(0), done: false});
  expect(entries.next()).toEqual({value: undefined, done: true});
});

test('equals', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(3);
  expect(buf.equals(Buffer.from('abcdxy'))).toBe(true);
  expect(buf.equals(Buffer.from('adcdxy'))).toBe(false);
  expect(buf.equals(Buffer.from('abcdxy1'))).toBe(false);
  expect(buf.equals(Buffer.from('a'))).toBe(false);
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(3);
});

test('compare', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');

  const buf2 = new BufferCollection();
  buf2.push('12cd');
  buf2.push('x');
  buf2.push('6');

  expect(buf.compare(buf2) > 0).toBe(true);
  expect(buf.compare(buf2, 1) > 0).toBe(true);
  expect(buf.compare(buf2, 2) < 0).toBe(true);
  expect(buf.compare(buf2, 3) < 0).toBe(true);
  expect(buf.compare(buf2, 4) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 3, 2, 3) === 0).toBe(true);
  expect(buf.compare(buf2, 2, 3, 2, 4) > 0).toBe(true);
  expect(buf.compare(buf2, 2, 3, 2, 2) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 5, 2, 5) === 0).toBe(true);
  expect(buf.compare(buf2, 2, 6, 2, 6) > 0).toBe(true);
  expect(buf.compare(buf2, 2, 6, 2, 5) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 3, 2, 5) > 0).toBe(true);
  expect(buf.compare(buf2, 2, 5, 2, 4) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 5, 2) > 0).toBe(true);
  expect(buf.compare(buf2, 2, 4, 1) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 4) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 3) < 0).toBe(true);
  expect(buf.compare(buf2, 2, 2) > 0).toBe(true);

  expect(buf.compare(Buffer.from('12cdx6'), 2, 2) > 0).toBe(true);
});

test('toString', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('abcd1234');
  expect(buf.toString()).toBe('abcdxyabcd1234');
});

test('readUInt8', () => {
  const b1 = Buffer.from([255, 240]);
  const b2 = Buffer.from([1]);
  const b3 = Buffer.from([3, 9, 7]);
  const buf = new BufferCollection();
  buf.push(b1);
  buf.push(b2);
  buf.push(b3);
  expect(buf.readUInt8(0)).toBe(255);
  expect(buf.readUInt8(1)).toBe(240);
  expect(buf.readUInt8(2)).toBe(1);
  expect(buf.readUInt8(3)).toBe(3);
  expect(buf.readUInt8(4)).toBe(9);
  expect(buf.readUInt8(5)).toBe(7);
});

test('writeUInt8', () => {
  const b1 = Buffer.from('ab');
  const b2 = Buffer.from('c');
  const b3 = Buffer.from('def');
  const buf = new BufferCollection();
  buf.push(b1);
  buf.push(b2);
  buf.push(b3);
  buf.writeUInt8('1'.charCodeAt(0), 0);
  buf.writeUInt8('2'.charCodeAt(0), 1);
  buf.writeUInt8('3'.charCodeAt(0), 2);
  buf.writeUInt8('4'.charCodeAt(0), 3);
  buf.writeUInt8('5'.charCodeAt(0), 4);
  buf.writeUInt8('6'.charCodeAt(0), 5);
  expect(buf.length).toBe(6);
  expect(buf.count).toBe(3);
  expect(buf.toString()).toBe('123456');
});

test('iterator', () => {
  const buf = new BufferCollection();
  buf.push('abcd');
  buf.push('x');
  buf.push('y');
  buf.push('abcd1234');
  const arr = [];
  for (const value of buf) {
    arr.push(String.fromCharCode(value));
  }
  expect(arr.length).toBe(14);
  expect(arr.join('')).toBe('abcdxyabcd1234');
});

test('inspect', () => {
  const buf = new BufferCollection();
  buf.push(Buffer.from('123456789012345678901234567890'));
  expect(buf.inspect()).toBe('<BufferCollection 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30>');
  buf.push(Buffer.from('123456789012345678901234567890'));
  expect(buf.inspect()).toBe('<BufferCollection 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 ... >');
});

test('to-json', () => {
  const buf = new BufferCollection();
  buf.push(Buffer.from([1, 2, 3]));
  buf.push(Buffer.from([4, 5, 6]));
  buf.push(Buffer.from([7]));
  expect(buf.toJSON()).toEqual({
    type: 'Buffer',
    data: [1, 2, 3, 4, 5, 6, 7]
  });
});