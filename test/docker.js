// Tests the image generated from the `Dockerfile` in the project root

// Full API:
//   - http://www.chaijs.com/api/bdd/
//   - https://www.npmjs.com/package/chai-as-promised
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

chai.should()

const docker = new require('dockerode')()

const { doesFileExist, wait } = require('../src/utils.js')


describe("The app's docker container or environment", function() {

  this.timeout(20000)


  it('should have /var/run/docker.sock - Depends on caller to add `-v /var/run...`', async function() {
    const dockerSockExists = await doesFileExist('/var/run/docker.sock')

    dockerSockExists.should.equal(true)
  })


  it('should run `hello-world` image successfully', async function() {
    const container = await docker.createContainer({
      Image: 'hello-world',
      HostConfig: {
        AutoRemove: true
      }
    })
    let output = ''
    // TODO: Idk what `stream` parameter is for
    const containerOutputStream = await container.attach({stream: true, stdout: true})
    containerOutputStream.on('data', s => output += s)

    await container.start()

    output.should.have.string('Hello from Docker!')
  })


  it('should auto-remove a container when using AutoRemove: true', async function() {
    const container = await docker.createContainer({
      Image: 'hello-world',
      HostConfig: {
        AutoRemove: true
      }
    })

    await container.start()
    await container.wait({condition: 'removed'})

    // all: to include non-running containers
    const matchingContainers = await docker.listContainers({all: true, filters: `{"id": ["${container.id}"]}`})
    matchingContainers.should.be.empty
  })
})