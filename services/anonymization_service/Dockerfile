FROM python:3.11-slim

WORKDIR /app

COPY services/anonymization_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Génération des stubs gRPC depuis le proto
COPY proto/ /proto/
RUN python -m grpc_tools.protoc \
        -I /proto \
        --python_out=. \
        --grpc_python_out=. \
        /proto/anonymization_service.proto

COPY services/anonymization_service/ .

EXPOSE 50052

CMD ["python", "main.py"]
