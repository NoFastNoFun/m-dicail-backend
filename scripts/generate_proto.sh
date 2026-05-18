#!/bin/bash
# Run from the root of m-dicail-backend/
# Generates Python gRPC stubs from .proto files into apps/gateway/generated/

set -e

OUT_DIR="apps/gateway/generated"
mkdir -p "$OUT_DIR"

for proto_file in proto/*.proto; do
  echo "Generating stubs for $proto_file..."
  python -m grpc_tools.protoc \
    -I proto \
    --python_out="$OUT_DIR" \
    --grpc_python_out="$OUT_DIR" \
    "$proto_file"
done

echo "Done. Stubs generated in $OUT_DIR/"
