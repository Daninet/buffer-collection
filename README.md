buffer-collection
=======

[![Build Status](https://travis-ci.org/Daninet/buffer-collection.svg?branch=master)](https://travis-ci.org/Daninet/buffer-collection)
[![Coverage Status](https://coveralls.io/repos/github/Daninet/buffer-collection/badge.svg?branch=master)](https://coveralls.io/github/Daninet/buffer-collection?branch=master)
[![license](https://img.shields.io/github/license/Daninet/buffer-collection.svg)](https://github.com/Daninet/buffer-collection/blob/master/LICENSE)

Treat multiple Buffers as a single contiguous Buffer.

BETA VERSION! Development in progress.

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

buf.get(offset)
-------
Gets the byte value from the specified offset. Can be used as replacement for buf[offset]. Same as buf.readUInt8(offset)

buf.set(offset, value)
-------
Sets the byte value at the specified offset. Can be used as replacement for buf[offset]. Same as buf.writeUInt8(value, offset)

buf.shiftBuffer()
-------
Removes the first Buffer from collection and returns it. This method changes the length of the data of BufferCollection.

buf.slice([start[, end]])
-------
Returns a new BufferCollection that references the same memory as the original, but offset and cropped by the start and end indices. Works similarly as slice method of Buffers.


\+ Methods from Node.js Buffer API
=======

These methods were adapted to work on multiple Buffer instances without merging them into one contiguous memory section.

Buffer.alloc(size[, fill[, encoding]])
-------
Allocates a new Buffer of size bytes. If fill is undefined, the Buffer will be zero-filled.
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) regarding the usage.


Buffer.allocUnsafe(size)
-------
Allocates a new Buffer of size bytes. The underlying memory for Buffer instances created in this way is not initialized. The contents of the newly created Buffer are unknown and may contain sensitive data.
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_allocunsafe_size) regarding the usage.


Buffer.allocUnsafe(size)
-------
Allocates a new Buffer of size bytes. The underlying memory for Buffer instances created in this way is not initialized. The contents of the newly created Buffer are unknown and may contain sensitive data.
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_allocunsafe_size) regarding the usage.


Buffer.allocUnsafeSlow(size)
-------
Allocates a new Buffer of size bytes. The underlying memory for Buffer instances created in this way is not initialized. Not using allocation pools.
See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_allocunsafeslow_size) regarding the usage.


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


Unsupported Buffer methods
=======

Buffer.concat(list[, totalLength]) :x:

buf[index] :x: - please use buf.get(index)

buf.readIntBE(offset, byteLength[, noAssert]) :x:

buf.readIntLE(offset, byteLength[, noAssert]) :x:

buf.readUIntBE(offset, byteLength[, noAssert]) :x:

buf.readUIntLE(offset, byteLength[, noAssert]) :x:

buf.swap16() :x:

buf.swap32() :x:

buf.swap64() :x:

buf.writeIntBE(value, offset, byteLength[, noAssert]) :x:

buf.writeIntLE(value, offset, byteLength[, noAssert]) :x:

buf.writeUIntBE(value, offset, byteLength[, noAssert]) :x:

buf.writeUIntLE(value, offset, byteLength[, noAssert]) :x:

License
=======
MIT