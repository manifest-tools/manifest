
const orderService = require('./../../services/order/order')


exports.findUser = async ({ id }) => {
  const orders = await orderService.listOrdersForUser({ userId: id })
  return {
    id,
    username: 'ray',
    orders
  }
}
