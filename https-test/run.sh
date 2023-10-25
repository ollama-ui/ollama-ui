#!/bin/bash
docker build -t https-proxy .
docker run -p 443:443 https-proxy
