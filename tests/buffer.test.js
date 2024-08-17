import assert from 'node:assert/strict'
import '../index.js'

const checkBuffer = (instance) => {
  assert.strictEqual(instance.constructor.name, 'Buffer')
  assert.strictEqual(instance.constructor, Buffer)
  assert.strictEqual(Object.getPrototypeOf(instance), Buffer.prototype)
}

checkBuffer(Buffer.alloc(2).subarray(0, 1))
checkBuffer(Buffer.alloc(2).map(() => 1))
checkBuffer(Buffer.alloc(2).filter(() => true))
checkBuffer(Buffer.from([1, 2, 3]))
checkBuffer(Buffer.of(42, 43))
