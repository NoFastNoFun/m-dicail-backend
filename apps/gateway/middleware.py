import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import ALGORITHM, SECRET_KEY

PUBLIC_ROUTES = {
    "/auth/register",
    "/auth/login",
    "/docs",
    "/redoc",
    "/openapi.json",
}


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in PUBLIC_ROUTES:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Token manquant"})

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
        except jwt.ExpiredSignatureError:
            return JSONResponse(status_code=401, content={"detail": "Token expiré"})
        except jwt.InvalidTokenError:
            return JSONResponse(status_code=401, content={"detail": "Token invalide"})

        return await call_next(request)
