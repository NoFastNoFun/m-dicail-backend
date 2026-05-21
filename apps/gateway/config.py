import os

PORT = 8000

ANONYMIZATION_URL = f"http://{os.getenv('ANONYMIZATION_SERVICE_HOST', 'localhost')}:{os.getenv('ANONYMIZATION_SERVICE_PORT', '8001')}"
AI_URL = f"http://{os.getenv('AI_SERVICE_HOST', 'localhost')}:{os.getenv('AI_SERVICE_PORT', '8002')}"
PUBMED_URL = f"http://{os.getenv('PUBMED_SERVICE_HOST', 'localhost')}:{os.getenv('PUBMED_SERVICE_PORT', '8003')}"
REPORT_URL = f"http://{os.getenv('REPORT_SERVICE_HOST', 'localhost')}:{os.getenv('REPORT_SERVICE_PORT', '8004')}"
AUTH_URL = f"http://{os.getenv('AUTH_SERVICE_HOST', 'localhost')}:{os.getenv('AUTH_SERVICE_PORT', '8005')}"
PROTOCOL_URL = f"http://{os.getenv('PROTOCOL_SERVICE_HOST', 'localhost')}:{os.getenv('PROTOCOL_SERVICE_PORT', '8006')}"
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
