// Tests the image generated from the `Dockerfile` in the project root

// Full API: http://www.chaijs.com/api/bdd/
const expect = require('chai').expect

const { spawn } = require('child_process')


describe('generated docker image', function() {
  it('should contain geth & wnode in /usr/local/bin/', function(done) {
    const ls = spawn('ls', ['/usr/local/bin/'])

    let gethFound = false, wnodeFound = false

    ls.stdout.on('data', data => {
//      console.log(`ls stdout: ${data}`)
      if (data.includes('geth')) gethFound = true
      if (data.includes('wnode')) wnodeFound = true
      if (gethFound && wnodeFound)
        done()
    })
  })
})