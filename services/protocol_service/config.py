import os

PORT = 8006

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./protocols.db")
