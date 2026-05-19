import logging

import uvicorn
from fastapi import FastAPI

from .config import PORT
from .routes import router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="m-dicail API",
    description="Backend for the m-dicail physiotherapist assistant. Handles clinical note processing, AI recommendations, and report generation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
