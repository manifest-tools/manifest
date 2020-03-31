const express = require('express')

const SERVICE_PATH = './service.js'

const service = require(SERVICE_PATH)


const api = express()
api.use(express.json())

api.all('/:funcName', async (req, res) => {
  const { body, params: { funcName } } = req
  const fn = service[funcName]
  if (!fn) {
    res.status(404).send({ 'message': `Function ${funcName} does not exist on grpc service` })
    return
  }
  const result = await fn(body)
  res.json(result)
})

module.exports = {
  start: () => api.listen(5000, () => console.log(`Manifest rest server running on 5000...`))
}
