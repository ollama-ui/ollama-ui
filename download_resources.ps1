if (-Not (Test-Path resources)) {
    New-Item -ItemType Directory -Force -Path resources
}

Set-Location resources

Invoke-WebRequest https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css -OutFile bootstrap.min.css
Invoke-WebRequest https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js -OutFile bootstrap.bundle.min.js
Invoke-WebRequest https://cdn.jsdelivr.net/npm/marked@6.0.0/marked.min.js -OutFile marked.min.js
Invoke-WebRequest https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js -OutFile purify.min.js
