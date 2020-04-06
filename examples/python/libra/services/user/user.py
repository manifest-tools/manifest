from libra.core import db
from libra.services.order import order as order_service


def find_user(id):
    return {
        'id': id,
        'username': 'ray',
        'orders': orders
    }
