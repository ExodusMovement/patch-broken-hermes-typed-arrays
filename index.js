// We do not attempt to use any functionality here that is not natively supported on Hermes, including
// block-scoped vars -- Hermes fakes them, let/const is just an alias for vsr there and break expectations

// This method is designed start throwing on an engine update that can cause it to stop working or to break something
// That is a safeguard to ensure that things don't end up in a more broken state than they were initially

// This doesn't work with ECMAScript 2024 resizable ArrayBuffers, but at the moment Hermes does not support them
// We detect ArrayBuffer.prototype.resize and stop in that case. This might be fixed at need

// This also is not designed to work with Symbol.species support, but at the moment Hermes doesn't support that, too,
// and Symbol.species might even end up being dropped from spec

;(function fixHermesTypedArrayBug() {
  'use strict'

  var areWeBroken = function () {
    var called = 0
    var ok = true

    function TestArray(...args) {
      called++
      var buf = new Uint8Array(...args)
      Object.setPrototypeOf(buf, TestArray.prototype)
      return buf
    }

    Object.setPrototypeOf(TestArray.prototype, Uint8Array.prototype)
    Object.setPrototypeOf(TestArray, Uint8Array)

    var arr = new TestArray(1)
    ok &&= called === 1
    arr.subarray(0)
    ok &&= called === 2
    arr.map(() => 1)
    ok &&= called === 3
    arr.filter(() => true)
    ok &&= called === 4
    arr.slice(0)
    ok &&= called === 5

    var broken = arr.subarray(0).constructor !== TestArray || !ok || called !== 6
    // If `called` is of unexpected value for brokenness -- we can't be sure what is happening
    // For Symbol.species and ArrayBuffer.prototype.resize checks, see patch logic for explanation
    var shouldPatch = broken && called === 1 && !Symbol.species && !ArrayBuffer.prototype.resize
    return { broken, shouldPatch }
  }

  var { broken, shouldPatch } = areWeBroken()
  if (!broken) return
  if (broken && !shouldPatch) throw new Error('Could not patch broken TypedArray')

  // Note: does not follow %Symbol.species%, but Hermes doesn't support it anyway
  // Refs: https://tc39.es/ecma262/2024/#sec-get-%typedarray%-%symbol.species%

  var TypedArray = Object.getPrototypeOf(Uint8Array)
  var { subarray, map, filter, slice } = TypedArray.prototype

  // This conforms to 2023 edition, but not 2024 edition with resizable ArrayBuffer instances
  // This is why we are not safe if an engine (1) has broken TypedArrays and (2) implements ArrayBuffer.prototype.resize
  // The behavior is identical though if the underlying ArrayBuffer is not a resizable one
  // Refs: https://tc39.es/ecma262/2024/#sec-%typedarray%.prototype.subarray, steps 15-17
  //   NOTE: step 15 from 2024 edition is ignored and we don't call a 1-argument version
  //   17. Return ? TypedArraySpeciesCreate(O, argumentsList).
  // Refs: https://tc39.es/ecma262/2023/#sec-%typedarray%.prototype.subarray, steps 18-19
  //   18. Let argumentsList be « buffer, 𝔽(beginByteOffset), 𝔽(newLength) ».
  //   19. Return ? TypedArraySpeciesCreate(O, argumentsList).
  TypedArray.prototype.subarray = function (...args) {
    var arr = subarray.apply(this, args)
    if (!this.constructor || arr.constructor === this.constructor) return arr

    return new this.constructor(arr.buffer, arr.byteOffset, arr.byteLength)
  }

  var callTypedArrayCreateWithSizeFromTypedArray = function (arg, typed) {
    if (!arg.constructor || arg.constructor === typed.constructor) return typed

    // Fast path, non-spec hack for 'buffer'
    if (arg._isBuffer) return new arg.constructor(typed.buffer, typed.byteOffset, typed.byteLength)

    // Copies but this is the only proper way to call the constructor per spec here
    var A = new arg.constructor(typed.length)
    var n
    for (n = 0; n < typed.length; n++) A['' + n] = typed[n]
    return A
  }

  // Refs: https://tc39.es/ecma262/2024/#sec-%typedarray%.prototype.map, step 5
  //    5. Let A be ? TypedArraySpeciesCreate(O, « 𝔽(len) »).
  TypedArray.prototype.map = function (...args) {
    return callTypedArrayCreateWithSizeFromTypedArray(this, map.apply(this, args))
  }

  // Refs: https://tc39.es/ecma262/2024/#sec-%typedarray%.prototype.filter, step 9
  //    9. Let A be ? TypedArraySpeciesCreate(O, « 𝔽(captured) »).
  TypedArray.prototype.filter = function (...args) {
    return callTypedArrayCreateWithSizeFromTypedArray(this, filter.apply(this, args))
  }

  // Refs: https://tc39.es/ecma262/2024/#sec-%typedarray%.prototype.slice, step 13
  //   13. Let A be ? TypedArraySpeciesCreate(O, « 𝔽(countBytes) »).
  TypedArray.prototype.slice = function (...args) {
    // https://www.npmjs.com/package/buffer overrides this method, but let's still use a fast path
    // TypedArray.prototype.slice can still be called on Buffer:
    // e.g. Uint8Array.prototype.slice.call(Buffer.alloc(10), 2)
    // should return an instance of a child class (i.e. Buffer in this example)
    // _isBuffer fast path is included in the following call
    return callTypedArrayCreateWithSizeFromTypedArray(this, slice.apply(this, args))
  }

  if (areWeBroken().broken) throw new Error('TypedArray patch did not work somewhy!')
})();
