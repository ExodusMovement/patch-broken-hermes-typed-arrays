import '../index.js'

describe('TypedArray tests', () => {
  const classes = [
    Uint8Array,
    Int8Array,
    Uint16Array,
    Int16Array,
    Uint32Array,
    Int32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
  ]
  test.each(classes.map((base) => ({ base, name: base.name })))('$name', ({ base }) => {
    const isBig = base === BigInt64Array || base === BigUint64Array
    const num = base === Uint16Array ? 2 ** 15 : isBig ? 2n ** 62n : 113
    const n3 = isBig ? 3n : 3
    const n1 = isBig ? 1n : 1

    class TestArray extends base {
      static instances = 0
      constructor(...args) {
        super(...args)
        TestArray.instances++ // count constructor calls
        return this
      }

      hello() {
        return 'hi there'
      }
    }

    const arr = new TestArray(10)

    const checkInstance = (instance, fill = true) => {
      expect(instance.constructor.name).toBe('TestArray')
      expect(instance.constructor).toBe(TestArray)
      expect(instance.hello()).toBe('hi there')
      expect(Object.getPrototypeOf(instance)).toBe(TestArray.prototype)
      if (fill) {
        for (let i = 0; i < instance.length; i++) expect(instance[i]).not.toBe(n1)
        // eslint-disable-next-line @exodus/mutable/no-param-reassign-prop-only
        for (let i = 0; i < instance.length; i++) instance[i] = n1
      }
    }

    expect(TestArray.instances).toBe(1)

    const mapped = arr.map((_, i) => (isBig ? BigInt(i) * 10n : i * 10))
    expect(TestArray.instances).toBe(2)
    checkInstance(mapped)

    const subarray = arr.subarray(0)
    expect(TestArray.instances).toBe(3)
    checkInstance(subarray, false) // same .buffer per spec
    expect(subarray.buffer).toBe(arr.buffer)
    expect(subarray.byteOffset).toBe(arr.byteOffset)

    const sliced = arr.slice(0)
    expect(TestArray.instances).toBe(4)
    checkInstance(sliced)

    const filtered = arr.filter((_, i) => i > 5)
    expect(TestArray.instances).toBe(5)
    checkInstance(filtered)
    expect(filtered.length).toBe(4)

    const from = TestArray.from([num, n3])
    expect(TestArray.instances).toBe(6)
    checkInstance(from, false) // don't want to mutate
    expect(from.length).toBe(2)
    expect(from[0]).toBe(num)
    expect(from[1]).toBe(n3)

    for (let i = 0; i < arr.length; i++) expect(arr[i]).not.toBe(n1)
  })
})
