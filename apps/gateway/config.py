import os

PORT = 8000

ANONYMIZATION_URL = f"http://{os.getenv('ANONYMIZATION_SERVICE_HOST', 'localhost')}:{os.getenv('ANONYMIZATION_SERVICE_PORT', '8001')}"
AI_URL = f"http://{os.getenv('AI_SERVICE_HOST', 'localhost')}:{os.getenv('AI_SERVICE_PORT', '8002')}"
PUBMED_URL = f"http://{os.getenv('PUBMED_SERVICE_HOST', 'localhost')}:{os.getenv('PUBMED_SERVICE_PORT', '8003')}"
AUTH_URL = f"http://{os.getenv('AUTH_SERVICE_HOST', 'localhost')}:{os.getenv('AUTH_SERVICE_PORT', '8005')}"
PATIENT_URL = f"http://{os.getenv('PATIENT_SERVICE_HOST', 'localhost')}:{os.getenv('PATIENT_SERVICE_PORT', '8006')}"
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set")
ALGORITHM = "HS256"
