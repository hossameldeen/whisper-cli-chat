// Full API:
//   - http://www.chaijs.com/api/bdd/
//   - https://www.npmjs.com/package/chai-as-promised
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

chai.should()

const Web3 = require('web3')
const { spawn } = require('child_process')

const waitPort = require('wait-port')


describe('geth', function() {

  let testState = {}
  this.timeout(15000)

  beforeEach('start geth node', async function() {
    startNodeInBackground()
    // TODO: suppress logs
    await waitPort({port: 8545, timeout: 5000, interval: 1000})
  })

  afterEach('stop geth node', async function() {
    await killNode()
  })


  it('.isListening() should throw since no http provider on http://localhost:8544', async function() {
    const shh = new Web3(new Web3.providers.HttpProvider('http://localhost:8544')).shh

    await shh.net.isListening().should.be.rejected
  })


  it('.isListening() should return true since geth started on http://localhost:8545', async function() {
    const shh = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')).shh

    const isListening = await shh.net.isListening()

    isListening.should.be.true
  })


  it('should get shh version', async function() {
    const shh = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')).shh

    const shhVersion = await shh.getVersion()

    // TODO: I'm now working with version 6.0. Test will need to be updated when a new version is used
    shhVersion.should.equal('6.0')
  })


  function startNodeInBackground() {
    // TODO: change to ipc & stop exposing the rpc provider
    // TODO: whisper doesn't need ethereum blockchain. Currently, I'm using --dev to be as lightweight as possible blockchain-wise
    // The bootnodes belong to Status.im. See #4 on github's repo.
    testState.geth = spawn('geth', ['--dev', '--shh', '--rpc', '--rpcaddr', '127.0.0.1', '--bootnodes', 'enode://90cbf961c87eb837adc1300a0a6722a57134d843f0028a976d35dff387f101a2754842b6b694e50a01093808f304440d4d968bcbc599259e895ff26e5a1a17cf@51.15.194.39:30303', 'enode://fa63a6cc730468c5456eab365b2a7a68a166845423c8c9acc363e5f8c4699ff6d954e7ec58f13ae49568600cff9899561b54f6fc2b9923136cd7104911f31cce@163.172.168.202:30303'])

//    testState.geth.stdout.on('data', data => console.log(`geth stdout: ${data}`))
//    testState.geth.stderr.on('data', data => console.log(`geth stderr: ${data}`))
//    testState.geth.on('exit', (code, signal) => {console.log(`geth either exited with code ${code} or due to signal ${signal}`)})
  }

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

  async function wait(timeout) {
    return new Promise((resolve, _) => setTimeout(resolve, timeout))
  }
})