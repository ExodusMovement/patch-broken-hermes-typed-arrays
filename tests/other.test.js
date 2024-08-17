import assert from 'node:assert/strict'
import '../index.js'

class TestArray extends Uint16Array {
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

const checkInstance = (instance) => {
  assert.equal(instance.constructor.name, 'TestArray')
  assert.equal(instance.constructor, TestArray)
  assert.equal(instance.hello(), 'hi there')
  assert.equal(Object.getPrototypeOf(instance), TestArray.prototype)
}

const arr = new TestArray(10)
assert.equal(TestArray.instances, 1)

const mapped = arr.map((_, i) => i * 10)
assert.equal(TestArray.instances, 2)
checkInstance(mapped)

const subarray = arr.subarray(0)
assert.equal(TestArray.instances, 3)
checkInstance(subarray)

const sliced = arr.slice(0)
assert.equal(TestArray.instances, 4)
checkInstance(sliced)

const filtered = arr.filter((_, i) => i > 5)
assert.equal(TestArray.instances, 5)
checkInstance(filtered)
assert.equal(filtered.length, 4)

const from = TestArray.from([2 ** 15, 3])
assert.equal(TestArray.instances, 6)
checkInstance(from)
assert.equal(from.length, 2)
assert.equal(from[0], 2 ** 15)
assert.equal(from[1], 3)
