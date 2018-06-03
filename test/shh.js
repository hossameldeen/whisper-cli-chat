//const wtf = require('wtfnode') // uncomment this & the line containing `wtf.dump` for debugging code that doesn't exit

// Full API:
//   - http://www.chaijs.com/api/bdd/
//   - https://www.npmjs.com/package/chai-as-promised
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

chai.should()

const debug = require('debug')('whisperCliChat:shhTest')

const Web3 = require('web3')
const { spawn } = require('child_process')
const net = require('net')

const Geth = require('../src/geth.js')


describe('shh', function() {

  const N_NODES = 2
  const TEST_TIMEOUT = 120000

  // Each item in gethNodes has {container: dockerode container, containerIP: string}
  let testState = {
    geths: []
  }

  this.timeout(TEST_TIMEOUT)


  beforeEach('start geth nodes in docker containers that will be automatically removed when stopped', async function() {
//    setTimeout(function() {wtf.dump()}, TEST_TIMEOUT) // check the comment beside `const wtf = require('wtfnode')`

    const gethInitPromises = [...Array(N_NODES)].map(_ => Geth.init())

    testState.geths = await Promise.all(gethInitPromises)
  })

  afterEach('stop, thus automatically-remove, and wait till removal of geth docker containers', async function() {
    await Promise.all(testState.geths.map(geth => geth.destroy()))
  })


  it('.isListening() should return true since a geth started on ws://0.0.0.0:8546', async function() {
    const shh = testState.geths[0].shh

    const isListening = await shh.net.isListening()

    isListening.should.be.true
  })


  it('.isListening() should throw no provider on ws://localhost:8546', async function() {
    const shh = new Web3(new Web3.providers.WebsocketProvider(`ws://localhost:8546`)).shh

    await shh.net.isListening().should.be.rejected
  })


  it('should get shh version', async function() {
    const shh = testState.geths[0].shh

    const shhVersion = await shh.getVersion()

    // TODO: I'm now working with version 6.0. Test will need to be updated when a new version is used
    shhVersion.should.equal('6.0')
  })


  it('should generate same SymKey for same password', async function() {
    const shh = testState.geths[0].shh

    const pass1ID = await shh.generateSymKeyFromPassword('abc')
    const pass2ID = await shh.generateSymKeyFromPassword('abc')
    const symKey1 = await shh.getSymKey(pass1ID)
    const symKey2 = await shh.getSymKey(pass2ID)

    symKey1.should.equal(symKey2)
  })


  it('should save SymKey twice for same password', async function() {
    const shh = testState.geths[0].shh

    const pass1ID = await shh.generateSymKeyFromPassword('abc')
    const pass2ID = await shh.generateSymKeyFromPassword('abc')

    pass1ID.should.not.equal(pass2ID)
  })


  it('should receive message with symmetric encryption', function(done) {
    const web3 = testState.geths[0].web3
    const shh = web3.shh  // same as testState.geths[0].shh

    shh.generateSymKeyFromPassword('abc', (err, symKeyID) => {

      shh.subscribe('messages', {symKeyID: symKeyID, topics: ['0x8a2f110d']}, (err, m, sub) => {
        web3.utils.hexToUtf8(m.payload).should.equal('hiii')
        done()
      })

      shh.post({symKeyID: symKeyID, topic: '0x8a2f110d', payload: web3.utils.utf8ToHex('hiii'), powTime: 2, powTarget: 0.2})
    })
  })


  it.only('should, USING 2 DIFFERENT GETH NODES, receive message with symmetric encryption', function(done) {
    testState.geths[0].shh.generateSymKeyFromPassword('abc', (err, symKeyID) => {

      testState.geths[0].shh.subscribe('messages', {symKeyID: symKeyID, topics: ['0x8a2f110d']}, (err, m, sub) => {
        testState.geths[0].web3.utils.hexToUtf8(m.payload).should.equal('hiii')
        done()
      })

      testState.geths[1].shh.generateSymKeyFromPassword('abc', async (err, symKeyID) => {
        await testState.geths[1].shh.post({symKeyID: symKeyID, topic: '0x8a2f110d', payload: testState.geths[1].web3.utils.utf8ToHex('hiii'), powTime: 2, powTarget: 0.2})
      })
    })
  })
})