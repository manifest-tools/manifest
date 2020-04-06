import uvicorn
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route

from . import service


async def handler(request):
    fn_name = request.path_params['fn_name']
    fn_input = await request.json()
    fn = getattr(service, fn_name)
    kwargs = fn_input or {}
    result = fn(**kwargs)

    return JSONResponse(**result)

app = Starlette(debug=True, routes=[
    Route('/{fn_name}', handler)
])

uvicorn.run(app, host='0.0.0.0', port=8000)
