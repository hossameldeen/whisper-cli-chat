// Full API: http://www.chaijs.com/api/bdd/
const expect = require('chai').expect

it('should work correctly with async await', async function() {
  const promise = Promise.resolve(5)

  const x = await promise

  expect(x).to.equal(5)
})