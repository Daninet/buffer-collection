buffer-collection
=======

[![Build Status](https://travis-ci.org/Daninet/buffer-collection.svg?branch=master)](https://travis-ci.org/Daninet/buffer-collection)
[![Coverage Status](https://coveralls.io/repos/github/Daninet/buffer-collection/badge.svg?branch=master)](https://coveralls.io/github/Daninet/buffer-collection?branch=master)
[![license](https://img.shields.io/github/license/Daninet/buffer-collection.svg)](https://github.com/Daninet/buffer-collection/blob/master/LICENSE)

Treat multiple Buffers as a single contiguous Buffer.

Install
=======
    npm i buffer-collection


Example
=======
    const BufferCollection = require('buffer-collection');
    const buf = new BufferCollection();
    buf.push(Buffer.from([1, 2, 3]));
    buf.push([4]); // automatic conversion to Buffer
    buf.push([5, 6, 7]);

    const needle = Buffer.from([2, 3]);
    // 1
    console.log(buf.indexOf(needle));

    // <BufferCollection 02 03 04 05>
    console.log(buf.slice(1, 5));

    // <BufferCollection 01 02 03 01 02 03 01>
    console.log(buf.fill(Buffer.from([1, 2, 3])));

    // 4
    console.log(buf.lastIndexOf(needle));

    buf.writeInt32BE(0xdeadbeef, 1)
    // <BufferCollection 01 de ad be ef 03 01>
    console.log(buf);

    const bytes = [];
    for (const b of buf) {
    bytes.push(b.toString(16));
    }
    // [ '1', 'de', 'ad', 'be', 'ef', '3', '1' ]
    console.log(bytes);

Methods
=======

buf.push(element)
-------
Adds a new Buffer to the end of the current collection.

buf.compact()
-------
Merges internal array of buffers to a single buffer. It is called when data becomes very fragmented and the performance should be improved.

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
Compares buf with target and returns a number indicating whether buf comes before, after, or is the same as target in sort order. 

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_compare_target_targetstart_targetend_sourcestart_sourceend) regarding the usage.


buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
-------
Copies data from a region of buf to a region in target even if the target memory region overlaps with buf.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_copy_target_targetstart_sourcestart_sourceend) regarding the usage.


buf.entries()
-------
Creates and returns an iterator of [index, byte] pairs from the contents of buf.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_entries) regarding the usage.


buf.equals(otherBuffer)
-------
Returns true if both buf and otherBuffer have exactly the same bytes, false otherwise.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_equals_otherbuffer) regarding the usage.


buf.fill(value[, offset[, end]][, encoding])
-------
Fills buf with the specified value.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_fill_value_offset_end_encoding) regarding the usage.


buf.includes(value[, byteOffset][, encoding])
-------
Equivalent to buf.indexOf() !== -1.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_includes_value_byteoffset_encoding) regarding the usage.


buf.indexOf(value[, byteOffset][, encoding])
-------
Returns the first index at which a given element can be found in the Buffers, or -1 if it is not present.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_indexof_value_byteoffset_encoding) regarding the usage.


buf.keys()
-------
Creates and returns an iterator of buf keys (indices).

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_keys) regarding the usage.


buf.lastIndexOf(value[, byteOffset][, encoding])
-------
Identical to buf.indexOf(), except buf is searched from back to front instead of front to back.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_lastindexof_value_byteoffset_encoding) regarding the usage.


buf.length
-------
Returns the amount of memory allocated for buf in bytes. Note that this does not necessarily reflect the amount of "usable" data within buf.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_length) regarding the usage.


buf.readDoubleBE(offset[, noAssert])
-------
Reads a 64-bit double from buf at the specified offset with big endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readdoublebe_offset_noassert) regarding the usage.


buf.readDoubleLE(offset[, noAssert])
-------
Reads a 64-bit double from buf at the specified offset with little endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readdoublele_offset_noassert) regarding the usage.


buf.readFloatBE(offset[, noAssert])
-------
Reads a 32-bit float from buf at the specified offset with big endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readfloatbe_offset_noassert) regarding the usage.


buf.readFloatLE(offset[, noAssert])
-------
Reads a 32-bit float from buf at the specified offset with little endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readfloatle_offset_noassert) regarding the usage.


buf.readInt8(offset[, noAssert])
-------
Reads a signed 8-bit integer from buf at the specified offset.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint8_offset_noassert) regarding the usage.


buf.readInt16BE(offset[, noAssert])
-------
Reads a signed 16-bit integer from buf at the specified offset with the big endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint16be_offset_noassert) regarding the usage.


buf.readInt16LE(offset[, noAssert])
-------
Reads a signed 16-bit integer from buf at the specified offset with the little endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint16le_offset_noassert) regarding the usage.


buf.readInt32BE(offset[, noAssert])
-------
Reads a signed 32-bit integer from buf at the specified offset with the big endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint32be_offset_noassert) regarding the usage.


buf.readInt32LE(offset[, noAssert])
-------
Reads a signed 32-bit integer from buf at the specified offset with the little endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readint32le_offset_noassert) regarding the usage.


buf.readUInt8(offset[, noAssert])
-------
Reads an unsigned 8-bit integer from buf at the specified offset.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint8_offset_noassert) regarding the usage.


buf.readUInt16BE(offset[, noAssert])
-------
Reads a unsigned 16-bit integer from buf at the specified offset with the big endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint16be_offset_noassert) regarding the usage.


buf.readUInt16LE(offset[, noAssert])
-------
Reads a unsigned 16-bit integer from buf at the specified offset with the little endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint16le_offset_noassert) regarding the usage.


buf.readUInt32BE(offset[, noAssert])
-------
Reads a unsigned 32-bit integer from buf at the specified offset with the big endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint32be_offset_noassert) regarding the usage.


buf.readUInt32LE(offset[, noAssert])
-------
Reads a unsigned 32-bit integer from buf at the specified offset with the little endian format.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_readuint32le_offset_noassert) regarding the usage.


buf.slice([start[, end]])
-------
Returns a new BufferCollection that references the same memory as the original, but offset and cropped by the start and end indices.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_slice_start_end) regarding the usage.


buf.swap16()
-------
Interprets buf as an array of unsigned 16-bit integers and swaps the byte-order in-place.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_swap16) regarding the usage.


buf.swap32()
-------
Interprets buf as an array of unsigned 32-bit integers and swaps the byte-order in-place.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_swap32) regarding the usage.


buf.swap64()
-------
Interprets buf as an array of unsigned 64-bit integers and swaps the byte-order in-place.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_swap64) regarding the usage.


buf.toJSON()
-------
Returns a JSON representation of buf. JSON.stringify() implicitly calls this function when stringifying a BufferCollection instance.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_tojson) regarding the usage.


buf.toString([encoding[, start[, end]]])
-------
Decodes buf to a string according to the specified character encoding in encoding.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end) regarding the usage.


buf.values()
-------
Creates and returns an iterator for buf values (bytes). This function is called automatically when a Buffer is used in a for..of statement.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_values) regarding the usage.


buf.write()
-------
Writes string to buf at offset according to the character encoding in encoding. The length parameter is the number of bytes to write. 

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_write_string_offset_length_encoding) regarding the usage.


buf.writeDoubleBE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with big endian format. value should be a valid 64-bit double. 

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writedoublebe_value_offset_noassert) regarding the usage.


buf.writeDoubleLE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with little endian format. value should be a valid 64-bit double. 

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writedoublele_value_offset_noassert) regarding the usage.


buf.writeFloatBE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with big endian format. value should be a valid 32-bit float. 

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writefloatbe_value_offset_noassert) regarding the usage.


buf.writeFloatLE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with little endian format. value should be a valid 32-bit float. 

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writefloatle_value_offset_noassert) regarding the usage.


buf.writeInt8(value, offset[, noAssert])
-------
Writes value to buf at the specified offset. value should be a valid signed 8-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeint8_value_offset_noassert) regarding the usage.


buf.writeInt16BE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with big endian format. value should be a valid signed 16-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeint16be_value_offset_noassert) regarding the usage.


buf.writeInt16LE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with little endian format. value should be a valid signed 16-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeint16le_value_offset_noassert) regarding the usage.


buf.writeInt32BE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with big endian format. value should be a valid signed 32-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeint32be_value_offset_noassert) regarding the usage.


buf.writeInt32LE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with little endian format. value should be a valid signed 32-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeint32le_value_offset_noassert) regarding the usage.


buf.writeUInt8(value, offset[, noAssert])
-------
Writes value to buf at the specified offset. value should be a valid unsigned 8-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeuint8_value_offset_noassert) regarding the usage.


buf.writeUInt16BE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with big endian format. value should be a valid unsigned 16-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeuint16be_value_offset_noassert) regarding the usage.


buf.writeUInt16LE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with little endian format. value should be a valid unsigned 16-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeuint16le_value_offset_noassert) regarding the usage.


buf.writeUInt32BE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with big endian format. value should be a valid unsigned 32-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeuint32be_value_offset_noassert) regarding the usage.


buf.writeUInt32LE(value, offset[, noAssert])
-------
Writes value to buf at the specified offset with little endian format. value should be a valid unsigned 32-bit integer.

See [Node.js documentation](https://nodejs.org/api/buffer.html#buffer_buf_writeuint32le_value_offset_noassert) regarding the usage.


Unsupported Buffer methods
=======

:x: Buffer.concat(list[, totalLength])

:x: buf[index] - please use buf.get(index)

:x: buf.readIntBE(offset, byteLength[, noAssert])

:x: buf.readIntLE(offset, byteLength[, noAssert])

:x: buf.readUIntBE(offset, byteLength[, noAssert])

:x: buf.readUIntLE(offset, byteLength[, noAssert])

:x: buf.writeIntBE(value, offset, byteLength[, noAssert])

:x: buf.writeIntLE(value, offset, byteLength[, noAssert])

:x: buf.writeUIntBE(value, offset, byteLength[, noAssert])

:x: buf.writeUIntLE(value, offset, byteLength[, noAssert])

License
=======
MIT