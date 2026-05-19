import logging

import uvicorn
from fastapi import FastAPI

from .config import PORT
from .routes import router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="PubMed Service")
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
