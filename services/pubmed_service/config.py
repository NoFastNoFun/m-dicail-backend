import os

PORT = 8003

NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
# Optional we don't have it for the moment but it increases rate limit from 3 to 10 req/sec
NCBI_API_KEY = os.getenv("NCBI_API_KEY")
