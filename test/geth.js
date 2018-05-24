// Full API: http://www.chaijs.com/api/bdd/
const expect = require('chai').expect

const Web3 = require('web3')
const { spawn } = require('child_process')


describe('geth', function() {
  beforeEach('start geth node', async function() {
    await startNode()
  })


  it('should fail synchronously since no http provider on http://localhost:8544', async function() {
    expect(new Web3(new Web3.providers.HttpProvider('http://localhost:8544'))).to.throw()
  })


  it('should set use started geth node as http provider', async function() {
    assert(new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))).to.be.ok
  })


  it('should get shh version', async function() {
    const web3 = new require(Web3)(new Web3.providers.HttpProvider('http://localhost:8545'))
    const shh = web3.shh

    const shhVersion = await shh.getVersion()

    // TODO: I'm now working with version 6.0.0. Test will need to be updated when a new version is used
    expect(shhVersion).to.equal('6.0.0')
  })


  async function startNode() {
    // TODO: change 0.0.0.0
    // TODO: whisper doesn't need ethereum blockchain. Currently, I'm using --dev to be as lightweight as possible blockchain-wise
    const geth = spawn('/usr/local/bin/geth', ['--dev', '--rpc', '--rpcaddr', '0.0.0.0']);

//    geth.stdout.on('data', data => console.log(`geth stdout: ${data}`))
//    geth.stderr.on('data', data => console.log(`geth stderr: ${data}`))
//    geth.on('close', code => {console.log(`geth exited with code ${code}`)})

    return new Promise((resolve, reject) => {
      // TODO: checking the string is a hack. Should check by listening hitting port & trying out
      geth.stderr.on('data', data => {if (data.includes('HTTP endpoint opened')) resolve()})
      // If closed before `HTTP endpoint opened` then will reject. Otherwise, the rejection is ignored
      geth.on('close', code => reject(code))
    })
  }
})