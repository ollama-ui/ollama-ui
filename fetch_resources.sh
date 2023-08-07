#!/bin/sh

die(){
    echo "$1"
    exit 1
}

if [ ! -d resources ]; then
(
mkdir -p ./resources/ || die "couldn't mkdir ./resources/"
cd ./resources/ || die "couldn't cd into ./resources/"
curl https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css -O || die "failed to curl bootstrap.min.css"
curl https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js -O || die "failed to curl bootstrap.bundle.min.js"
curl https://cdn.jsdelivr.net/npm/marked@6.0.0/marked.min.js -O || die "failed to curl marked.min.js"
curl https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js -O || die "failed to curl purify.min.js"
)
fi

shasum -a 256 -c resources.hash || die "hash mismatch while downloading resources"
