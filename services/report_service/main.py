import grpc
from concurrent import futures
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = 50055


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    server.add_insecure_port(f"[::]:{PORT}")
    logger.info(f"report_service starting on port {PORT}...")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
