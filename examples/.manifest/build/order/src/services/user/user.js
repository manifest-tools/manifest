

const CLIENT_PATH = './client.js'

const client = require(CLIENT_PATH)


module.exports = new Proxy({}, {
  get(target, key) {
    return props => new Promise((resolve, reject) => {
      console.log(`Calling client function ... ${key}`)
      client.create()[key](props, (err, response) => {
        if (err) return reject(err)
        resolve(response)
      })
    })
  }
})
