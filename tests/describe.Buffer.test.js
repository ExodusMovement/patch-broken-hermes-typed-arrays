import '../index.js'

describe('Buffer tests', () => {
  test.each([
    { name: 'Buffer#subarray', instance: Buffer.alloc(2).subarray(0, 1) },
    { name: 'Buffer#filter', instance: Buffer.alloc(2).filter(() => true) },
    { name: 'Buffer#map', instance: Buffer.alloc(2).map((_, i) => i * 10) },
    { name: 'Buffer#slice', instance: Buffer.alloc(2).slice(0, 1) },
    { name: 'Buffer.from', instance: Buffer.from([1, 2, 3]) },
    { name: 'Buffer.of', instance: Buffer.of(42, 43) },
  ])('$name', ({ instance }) => {
    expect(instance.constructor.name).toBe('Buffer')
    expect(instance.constructor).toBe(Buffer)
    expect(Object.getPrototypeOf(instance)).toBe(Buffer.prototype)
  })
})
