
const db = require('../../core/db')

exports.findOrder = async ({ id }) => {
  await db.delay(100) // fake db call
  return {
    id,
    items: [{
      id: 1,
      name: 'xbox',
      price: 500
    }]
  }
}

exports.listOrdersForUser = async ({ userId }) => {
  await db.delay(100) // fake db call
  return {
    orders: [
      {
        id: 1,
        items: [{
          id: 1,
          name: 'xbox',
          price: 500
        }]
      }
    ]
  }
}
