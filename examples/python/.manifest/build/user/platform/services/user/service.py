from platform.core import db
from platform.services.order import order as order_service


async def find_user(id):
    orders = await order_service.list_orders_for_user(id)
    return {
        'id': id,
        'username': 'ray',
        'orders': orders
    }
