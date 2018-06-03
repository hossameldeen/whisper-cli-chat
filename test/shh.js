// Full API:
//   - http://www.chaijs.com/api/bdd/
//   - https://www.npmjs.com/package/chai-as-promised
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

chai.should()

const Web3 = require('web3')
const { spawn } = require('child_process')
const net = require('net')

const docker = new require('dockerode')()

const { waitTillTrue, doesFileExist, isTcpPortListening, wait } = require('../src/utils.js')


describe.only('shh', function() {

  let testState = {}
  this.timeout(30000)


  before('pull ethereum/client-go image', function(done) {
    docker.pull('ethereum/client-go', (err, stream) => {
      if (err) done(err)
      else done()
    })
  })


  beforeEach('start geth node in a docker container that will be automatically removed when stopped', async function() {
    const gethContainer = await docker.createContainer({
      Image: 'ethereum/client-go',
    // TODO: whisper doesn't need ethereum blockchain. Currently, I'm using --dev to be as lightweight as possible blockchain-wise
    // The bootnodes belong to Status.im. See #4 on github's repo.
      Cmd: ['--dev', '--shh', '--wsaddr', '0.0.0.0', '--ws', '--wsorigins', '*', '--bootnodes', 'enode://90cbf961c87eb837adc1300a0a6722a57134d843f0028a976d35dff387f101a2754842b6b694e50a01093808f304440d4d968bcbc599259e895ff26e5a1a17cf@51.15.194.39:30303', 'enode://fa63a6cc730468c5456eab365b2a7a68a166845423c8c9acc363e5f8c4699ff6d954e7ec58f13ae49568600cff9899561b54f6fc2b9923136cd7104911f31cce@163.172.168.202:30303'],
      HostConfig: {
        AutoRemove: true
      }
    })
    await gethContainer.start()

    const inspectOutput = await gethContainer.inspect()
    const ip = inspectOutput.NetworkSettings.IPAddress

    await waitTillTrue(1000, 10, () => isTcpPortListening(ip, 8546))

    testState.gethContainer = gethContainer
    testState.gethContainerIP = ip
  })

  afterEach('stop, thus automatically-remove, and wait till removal of geth docker container', async function() {
    await testState.gethContainer.stop()
    await testState.gethContainer.wait({condition: 'removed'})
  })


  it('.isListening() should return true since geth started on ws://0.0.0.0:8546', async function() {
    const shh = new Web3(new Web3.providers.WebsocketProvider(`ws://${testState.gethContainerIP}:8546`)).shh

    const isListening = await shh.net.isListening()

    isListening.should.be.true
  })


  it('.isListening() should throw no provider on ws://0.0.0.0:8547', async function() {
    const shh = new Web3(new Web3.providers.WebsocketProvider(`ws://${testState.gethContainerIP}:8547`)).shh

    await shh.net.isListening().should.be.rejected
  })


  it('should get shh version', async function() {
    const shh = new Web3(new Web3.providers.WebsocketProvider(`ws://${testState.gethContainerIP}:8546`)).shh

    const shhVersion = await shh.getVersion()

    // TODO: I'm now working with version 6.0. Test will need to be updated when a new version is used
    shhVersion.should.equal('6.0')
  })


  it('should generate same SymKey for same password', async function() {
    const shh = new Web3(new Web3.providers.WebsocketProvider(`ws://${testState.gethContainerIP}:8546`)).shh

    const pass1ID = await shh.generateSymKeyFromPassword('abc')
    const pass2ID = await shh.generateSymKeyFromPassword('abc')
    const symKey1 = await shh.getSymKey(pass1ID)
    const symKey2 = await shh.getSymKey(pass2ID)

    symKey1.should.equal(symKey2)
  })


  it('should save SymKey twice for same password', async function() {
    const shh = new Web3(new Web3.providers.WebsocketProvider(`ws://${testState.gethContainerIP}:8546`)).shh

    const pass1ID = await shh.generateSymKeyFromPassword('abc')
    const pass2ID = await shh.generateSymKeyFromPassword('abc')

    pass1ID.should.not.equal(pass2ID)
  })


  it('should receive message with symmetric encryption', function(done) {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${testState.gethContainerIP}:8546`))
    const shh = web3.shh

    shh.generateSymKeyFromPassword('abc', (err, symKeyID) => {

      shh.subscribe('messages', {symKeyID: symKeyID, topics: ['0x8a2f110d']}, (err, m, sub) => {
        web3.utils.hexToUtf8(m.payload).should.equal('hiii')
        done()
      })

      shh.post({symKeyID: symKeyID, topic: '0x8a2f110d', payload: web3.utils.utf8ToHex('hiii'), powTime: 2, powTarget: 0.2})
    })
  })
})