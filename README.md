buffer-collection
=======

[![Build Status](https://travis-ci.org/Daninet/buffer-collection.svg?branch=master)](https://travis-ci.org/Daninet/buffer-collection)
[![Coverage Status](https://coveralls.io/repos/github/Daninet/buffer-collection/badge.svg?branch=master)](https://coveralls.io/github/Daninet/buffer-collection?branch=master)
[![license](https://img.shields.io/github/license/Daninet/buffer-collection.svg)](https://github.com/Daninet/buffer-collection/blob/master/LICENSE)

Treat multiple Buffers as a single contiguous Buffer.

ALPHA VERSION! Development in progress.

Install
=======
    npm i buffer-collection


Methods
=======

buf.push(element)
-------
Adds a new Buffer to the end of the current collection.

buf.count
-------
Returns the number of Buffer instances in collection.

buf.slice([start[, end]])
-------
Returns a new BufferCollection that references the same memory as the original, but offset and cropped by the start and end indices.


\+ Methods from Node.js Buffer API
=======

These methods were adapted to work on multiple Buffer instances without merging them into one contiguous memory section.

buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_compare_target_targetstart_targetend_sourcestart_sourceend) regarding the usage.

buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_copy_target_targetstart_sourcestart_sourceend) regarding the usage.

buf.entries()
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_entries) regarding the usage.

buf.equals(otherBuffer)
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_equals_otherbuffer) regarding the usage.

buf.fill(value[, offset[, end]][, encoding])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_fill_value_offset_end_encoding) regarding the usage.

buf.includes(value[, byteOffset][, encoding])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_includes_value_byteoffset_encoding) regarding the usage.

buf.indexOf(value[, byteOffset][, encoding])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_indexof_value_byteoffset_encoding) regarding the usage.

buf.keys()
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_keys) regarding the usage.

buf.lastIndexOf(value[, byteOffset][, encoding])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_lastindexof_value_byteoffset_encoding) regarding the usage.

buf.length
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_length) regarding the usage.

buf.readInt8(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint8_offset_noassert) regarding the usage.

buf.readInt16BE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint16be_offset_noassert) regarding the usage.

buf.readInt16LE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint16le_offset_noassert) regarding the usage.

buf.readInt32BE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint32be_offset_noassert) regarding the usage.

buf.readInt32LE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint32le_offset_noassert) regarding the usage.

buf.readUInt8(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint8_offset_noassert) regarding the usage.

buf.readUInt16BE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint16be_offset_noassert) regarding the usage.

buf.readUInt16LE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint16le_offset_noassert) regarding the usage.

buf.readUInt32BE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint32be_offset_noassert) regarding the usage.

buf.readUInt32LE(offset[, noAssert])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint32le_offset_noassert) regarding the usage.

buf.slice([start[, end]])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_slice_start_end) regarding the usage.

buf.toString([encoding[, start[, end]]])
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end) regarding the usage.

buf.values()
-------
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_values) regarding the usage.



License
=======
MIT