import logging
import subprocess

import uvicorn
from fastapi import FastAPI

from .config import PORT
from .routes import router

logging.basicConfig(level=logging.INFO)

subprocess.run(["alembic", "upgrade", "head"], cwd="/app", check=True)

app = FastAPI(title="Patient Service")
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
