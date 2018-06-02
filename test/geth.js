//const wtf = require('wtfnode') // uncomment this & the line containing `wtf.dump` for debugging code that doesn't exit

// Full API:
//   - http://www.chaijs.com/api/bdd/
//   - https://www.npmjs.com/package/chai-as-promised
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

chai.should()

const Web3 = require('web3')
const { spawn } = require('child_process')

const { waitTillTrue, doesFileExist, isTcpPortListening, wait } = require('../src/utils.js')

//setTimeout(function() {wtf.dump()}, 5000) // check the comment beside `const wtf = require('wtfnode')`

describe.skip('geth', function() {

  let testState = {}
  this.timeout(20000)

  afterEach('stop geth node if started', async function() {
    if ('geth' in testState)
      await killNode()
  })


  it('should have /tmp/geth.ipc after starting', async function() {
    testState.geth = spawn('geth', ['--dev', '--rpc']);

    (await waitTillTrue(1000, 10, () => doesFileExist('/tmp/geth.ipc'))).should.equal(true)

    // If used this style, it behaves incorrectly. I know promises are not mathematically designed, so will just go with
    // the style above instead of debugging chai-as-promised
//    waitTillTrue(1000, 10, () => doesFileExist('/tmp/geth.ipc')).should.eventually.equal(true)
  })


  it('should be listening on 127.0.0.1:8545 after starting', async function() {
    testState.geth = spawn('geth', ['--dev', '--rpc']);

    (await waitTillTrue(1000, 10, async () => await isTcpPortListening('127.0.0.1', 8545))).should.equal(true)
  })


  it('should NOT, e.g., be listening on 127.0.0.1:8544 after starting', async function() {
    testState.geth = spawn('geth', ['--dev', '--rpc']);

    (await waitTillTrue(1000, 10, async () => await isTcpPortListening('127.0.0.1', 8544))).should.equal(false)
  })


  async function killNode() {
    return new Promise(async (resolve, reject) => {
      // TODO: Not so-nice code
      let killed = false;
      testState.geth.once('exit', (code, signal) => {
        resolve({code, signal})
        killed = true
      })

      testState.geth.kill()
      for (let timeout = 4000; timeout < 10000; timeout *= 2) {
        await wait(timeout)
        if (killed) return;
        testState.geth.kill('SIGKILL')
      }

      reject("Couldn't kill the geth node :(. Run `docker ps` & terminate it manually")
    })
  }
})