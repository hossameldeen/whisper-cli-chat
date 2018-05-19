(async function() {

  await startNode()
  console.log('whisper/ethereum node started')

  const Web3 = require('web3')
  const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
  const shh = web3.shh

  console.log('shh version:', await shh.getVersion(), '!')

})();


async function startNode() {
  const { spawn } = require('child_process');

  // TODO: move to alpine
  // TODO: change 0.0.0.0
  // TODO: is 30303 discovery port necessary?
  // TODO: whisper doesn't need ethereum blockchain. Currently, I'm using --dev to be as lightweight as possible blockchain-wise
  const docker = spawn('docker', ['run', '--rm', '-p', '8545:8545', '-p', '30303:30303', 'ethereum/client-go', '--dev', '--rpc', '--rpcaddr', '0.0.0.0']);

  // TODO: logging levels & stuff, you know
  docker.stdout.on('data', data => console.log(`docker stdout: ${data}`))
  docker.stderr.on('data', data => console.log(`docker stderr: ${data}`))
  docker.on('close', code => {console.log(`docker exited with code ${code}`)})

  return new Promise((resolve, reject) => {
    // TODO: checking the string is a hack. I'm not even sure when the node fully starts
    docker.stderr.on('data', data => {if (data.includes('HTTP endpoint opened')) resolve()})
    // If closed before `HTTP endpoint opened` then will reject. Otherwise, the rejection is ignored
    docker.on('close', code => reject(code))
  })
}
