const debug = require('debug')('whisperCliChat:geth')

const Web3 = require('web3')

const docker = new require('dockerode')()
const { waitTillTrue, isTcpPortListening } = require('../src/utils.js')


class Geth {
  static async init() {

    debug('START Pulling ethereum/client-go image...')
    await new Promise((resolve, reject) => docker.pull('ethereum/client-go', (err, stream) => {
      if (err) reject(err)
      else resolve()
    }))
    debug('END Pulling ethereum/client-go image')

    debug('START Creating a container of type ethereum/client-go...')
    const container = await docker.createContainer({
      Image: 'ethereum/client-go',
    // TODO: whisper doesn't need ethereum blockchain. Currently, I'm using --dev to be as lightweight as possible blockchain-wise
    // The bootnodes belong to Status.im. See #4 on github's repo.
//      Cmd: ['--testnet', '--shh', '--syncmode', 'light', '--wsaddr', '0.0.0.0', '--ws', '--wsorigins', '*', '--bootnodes', 'enode://f32efef2739e5135a0f9a80600b321ba4d13393a5f1d3f5f593df85919262f06c70bfa66d38507b9d79a91021f5e200ec20150592e72934c66248e87014c4317@167.99.209.79:30404', 'enode://90d7e7e34f588b44e1e07adfc6453b0d27946883420a012a837f6acfa66cbb28e6e8b5df3c0e26615ed82b32273453b1b003e4aa5c0d357ada30bde8f666db47@167.99.46.141:30404', '--shh.pow', '0.001'],
      Cmd: ['--dev', '--shh', '--wsaddr', '0.0.0.0', '--ws', '--wsorigins', '*', '--bootnodes', 'enode://90cbf961c87eb837adc1300a0a6722a57134d843f0028a976d35dff387f101a2754842b6b694e50a01093808f304440d4d968bcbc599259e895ff26e5a1a17cf@51.15.194.39:30303', 'enode://fa63a6cc730468c5456eab365b2a7a68a166845423c8c9acc363e5f8c4699ff6d954e7ec58f13ae49568600cff9899561b54f6fc2b9923136cd7104911f31cce@163.172.168.202:30303', '--shh.pow', '0.001'],
//      Cmd: ['--rinkeby', '--shh', '--syncmode', 'light', '--wsaddr', '0.0.0.0', '--ws', '--wsorigins', '*', '--bootnodes', 'enode://1b843c7697f6fc42a1f606fb3cfaac54e025f06789dc20ad9278be3388967cf21e3a1b1e4be51faecd66c2c3adef12e942b4fcdeb8727657abe60636efb6224f@206.189.6.46:30404', 'enode://b29100c8468e3e6604817174a15e4d71627458b0dcdbeea169ab2eb4ab2bbc6f24adbb175826726cec69db8fdba6c0dd60b3da598e530ede562180d300728659@206.189.6.48:30404', '--shh.pow', '0.001'],
//      Cmd: ['--shh', '--syncmode', 'light', '--wsaddr', '0.0.0.0', '--ws', '--wsorigins', '*', '--bootnodes', 'enode://f32efef2739e5135a0f9a80600b321ba4d13393a5f1d3f5f593df85919262f06c70bfa66d38507b9d79a91021f5e200ec20150592e72934c66248e87014c4317@167.99.209.79:30404', 'enode://90d7e7e34f588b44e1e07adfc6453b0d27946883420a012a837f6acfa66cbb28e6e8b5df3c0e26615ed82b32273453b1b003e4aa5c0d357ada30bde8f666db47@167.99.46.141:30404', '--shh.pow', '0.001'],
      HostConfig: {
        AutoRemove: true
      }
    })
    debug('END Creating a container of type ethereum/client-go, container-id=', container.id)

    debug('START Starting the container with id=', container.id, '...')
    await container.start()
    debug('END Starting the container with id=', container.id)

    const inspectOutput = await container.inspect()
    const ip = inspectOutput.NetworkSettings.IPAddress

    debug('START waiting the container to start listening on 8546. Container ip=', ip, ', container id=', container.id)
    await waitTillTrue(1000, 10, () => isTcpPortListening(ip, 8546))
    debug('END waiting the container to start listening on 8546. Container ip=', ip, ', container id=', container.id)

    debug('START creating the web3 instance of container with id=', container.id)
    const web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${ip}:8546`))
    debug('END creating the web3 instance of container with id=', container.id)

    return new Geth(container, web3)
  }

  /**
  * Not intended to be called directly. Call `await Geth.init();` instead
  */
  constructor(container, web3) {
    if (container === undefined || web3 === undefined)
      throw new Error("Can't instantiate Geth without container & web3 parameters. Probably, this should achieve what you're trying to do:`geth = await Geth.init();`")

    this._container = container
    this._web3 = web3
  }

  get web3() {
    return this._web3
  }

  /**
  * Just a shorthand foe geth.web3.shh
  */
  get shh() {
    return this._web3.shh
  }

  /**
   * Stops & removes the docker container used by this geth node.
   *
   * REMEMBER: call `await destroy()`! TODO: Perhaps create naming conventions for async functions? .. or perhaps
   *                                   TODO: linting could catch mistakes like forgetting to await?
   *
   * If you don't call manually, no harm, but you may want to remove it manually from your system at one point.
   *
   * Thought about adding a member variable `isDestroyed` & checking on it & throwing an exception if you try to call
   * a function after it's destroyed. However,:
   * 1- The way this class is designed, you don't have to go through `Geth` class all the time.
   * 2- The elegant point: if you attempt to use the geth node after it's destroyed, you'll get an error anyhow. But
   *    yes, might've been nice if I could tell you a better error message using the info I have that you destroyed the
   *    geth.
   */
  async destroy() {
    debug('START stopping container with id=', this._container.id)
    await this._container.stop()
    debug('END stopping container with id=', this._container.id)
    debug('START Awaiting removal of container with id=', this._container.id)
    try {
      await this._container.wait({condition: 'removed'})
      debug('END Awaiting removal of container with id=', this._container.id)
    }
    catch(e) {
      if (e.message.includes("no such container - No such container"))
        debug('END Awaiting removal of container with id=', this._container.id, ". However, an exception was actually thrown that container wasn't but it's probably due to luck that container was removed even before we waited for its removal")
      else
        throw e
    }
  }
}

module.exports = Geth