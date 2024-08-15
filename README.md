# `@exodus/patch-broken-hermes-typed-arrays`

Fix broken Hermes engine TypedArray implementation for React Native, simply
```js
import '@exodus/patch-broken-hermes-typed-arrays'
```

## What is this about?

The problem behind this issue:
```js
> Buffer.alloc(10).subarray(0).toString('hex')
'0,0,0,0,0,0,0,0,0,0'
// What?
```

You might be inclined to fix the specific location where this is throwing (e.g. with a
`Buffer.from`), but that is a mistake.

Most important: **it is very hard to track all those**.

_Also, `Buffer.from(arg)` is a copy and inefficiency,
`Buffer.from(x.buffer, x.byteOffset, x.byteLength)` is awkward, prone to human errors and can
trigger security checks for doing something on `buffer.buffer` manually (which is an unsafe
practice, e.g. a mistype like `x.byteLegnth` can leak passwords/secrets to other users by exposing
unrelated application memory). You don't want a ton of copies of that pattern in your codebase._

Fixing this on `Buffer` (e.g. by monkey-patching it) is also insufficient — your codebase could
include multiple dependencies which bundled [buffer](https://www.npmjs.com/package/buffer), and all
those instances won't be fixed that way!

Also, this affects more than `Buffer` and more than `subarray` — Hermes engine doesn't implement
[TypedArray](https://tc39.es/ecma262/#sec-%typedarray%-intrinsic-object) correctly.

i.e. Hermes implementation of `TypedArray` doesn't follow these sections of the specification:
 * [ECMAScript® Language Specification, `%TypedArray%.prototype.subarray`](https://tc39.es/ecma262/#sec-%typedarray%.prototype.subarray)
 * [ECMAScript® Language Specification, `%TypedArray%.prototype.map`](https://tc39.es/ecma262/#sec-%typedarray%.prototype.map)
 * [ECMAScript® Language Specification, `%TypedArray%.prototype.filter`](https://tc39.es/ecma262/#sec-%typedarray%.prototype.filter)
 * [ECMAScript® Language Specification, `%TypedArray%.prototype.slice`](https://tc39.es/ecma262/#sec-%typedarray%.prototype.slice)

## The fix

Overall, this module is just a glorified version of the following this snippet (but with
`.map`/`.filter` support and safeguards against Hermes updates, to detect if things change).

```js
TypedArray.prototype.subarray = function (...args) {
  var arr = subarray.apply(this, args)
  if (!this.constructor || arr.constructor === this.constructor) return arr
  return new this.constructor(arr.buffer, arr.byteOffset, arr.byteLength)
}
```

Note: the above version might be not spec-compliant if Hermes implements resizable `TypedArray`s
from ECMAScript 2024, or e.g. starts supporting `Symbol.Species`

Also the snippet above doesn't have a Hermes check, so it will also blindly patch arrays if you
switch to JavaScriptCore

_This is why this module exists — it handles all that_

## The problem, in more details

E.g. with [buffer](https://www.npmjs.com/package/buffer):

```js
// ... import Buffer polyfill from https://npmjs.com/package/buffer
// ... and a console.log polyfill
console.log(Buffer.alloc(2).subarray(0, 1).constructor.name)
console.log(Buffer.alloc(2).map(() => 1).constructor.name)
console.log(Buffer.alloc(2).filter(() => true).constructor.name)
```

```console
% node buftest.0.js                                         
Buffer
Buffer
Buffer
% jsc buftest.0.js 
Buffer
Buffer
Buffer
% hermes buftest.0.js
Uint8Array
Uint8Array
Uint8Array
```

### This is not limited to `buffer`

```js
// Let's assume this will get transpiled for a demo, Hermes has no `class` support

class TestArray extends Uint16Array {
  static instances = 0
  constructor(...args) {
    super(...args)
    // console.log('We can do something here!')
    TestArray.instances++ // count constructor calls
    return this
  }

  hello() {
    return 'hi there'
  }
}

var arr = new TestArray(10)
// TestArray.instances: 1

var mapped = arr.map((_, i) => i * 10)
// TestArray.instances: 2

console.log(TestArray.instances) // 2 everywhere, but 1 in Hermes
console.log(mapped.constructor.name) // 'TestArray' everywhere, but 'Uint16Array' in Hermes
console.log(mapped.hello()) // throws in Hermes
```

## License

[MIT](./LICENSE)
