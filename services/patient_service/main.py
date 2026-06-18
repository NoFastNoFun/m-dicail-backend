import logging
import subprocess
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from .config import PORT
from .routes import router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    subprocess.run(["alembic", "upgrade", "head"], cwd="/srv/app", check=True)
    yield


app = FastAPI(title="Patient Service", lifespan=lifespan)
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
