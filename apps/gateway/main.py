import grpc
from concurrent import futures
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    server.add_insecure_port("[::]:50051")
    logger.info("Gateway gRPC server starting on port 50051...")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
