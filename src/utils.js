const { stat } = require('fs')
const net = require('net')

async function waitTillTrue(interval, times, anAsyncF) {
  for (let i = 0; i < times; ++i) {
    if (await anAsyncF())
      return true
    await wait(interval)
  }
  return false
}

function doesFileExist(filePath) {
  return new Promise((resolve, _) => stat(filePath, (err, _) => resolve(!err)))
}

async function isTcpPortListening(host, port) {
  return new Promise((resolve, _) => {
    const conn = net.connect(port, host)
      .on('error', () => resolve(false))
      .on('connect', () => {
        conn.end()
        resolve(true)
      })
  })
}

async function wait(timeout) {
  return new Promise((resolve, _) => setTimeout(resolve, timeout))
}

module.exports = {
  waitTillTrue: waitTillTrue,
  doesFileExist: doesFileExist,
  isTcpPortListening: isTcpPortListening,
  wait: wait
}