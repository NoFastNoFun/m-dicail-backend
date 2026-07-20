#!/usr/bin/env sh
set -e

CERT_DIR="$(cd "$(dirname "$0")/../nginx/certs" && pwd)"

mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=localhost"

echo "Self-signed certificates written to nginx/certs/"
