#!/bin/bash

mkdir -p ssl

openssl req \
  -newkey rsa:2048 \
  -x509 \
  -nodes \
  -keyout ssl/nginx.key \
  -new \
  -out ssl/nginx.crt \
  -subj /CN=localhost \
  -reqexts SAN \
  -extensions SAN \
  -config <(cat /etc/ssl/openssl.cnf \
      <(printf "\n[SAN]\nsubjectAltName=DNS:localhost")) \
  -sha256 \
  -days 3650

