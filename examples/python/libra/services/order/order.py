from libra.core import db

def find_order(id):
    return {
        'id': id,
        'items': [{
            'id': 1,
            'name': 'xbox',
            'price': 500
        }]
    }

def list_orders_for_user(userId):
    return {
        'orders': [{
            'id': 1,
            'items': [{
                'id': 1,
                'name': 'xbox',
                'price': 500
            }]
        }]
    }
}
