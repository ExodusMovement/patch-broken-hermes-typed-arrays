import '../index.js'

describe('method names', () => {
  test.each([
    { name: 'subarray', method: Uint8Array.prototype.subarray },
    { name: 'filter', method: Uint8Array.prototype.filter },
    { name: 'map', method: Uint8Array.prototype.map },
    { name: 'slice', method: Uint8Array.prototype.slice },
  ])('$name', ({ name, method }) => {
    expect(method.name).toBe(name)
  })
})
