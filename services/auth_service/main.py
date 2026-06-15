import logging
import subprocess

import uvicorn
from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .config import PORT
from .routes import limiter, router

logging.basicConfig(level=logging.INFO)

subprocess.run(["alembic", "upgrade", "head"], cwd="/app", check=True)

app = FastAPI(title="Auth Service")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
