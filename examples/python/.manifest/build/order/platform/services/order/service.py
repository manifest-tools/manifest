from platform.core import db

async def find_order(id):
    await db.delay(100)
    return {
        'id': id,
        'items': [{
            'id': 1,
            'name': 'xbox',
            'price': 500
        }]
    }

async def list_orders_for_user(userId):
    await db.delay(1) # fake db call
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
