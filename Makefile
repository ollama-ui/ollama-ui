.PHONY: default download_resources web_server ollama_server clean

# Default task that downloads the assets and starts the ollama and web server
default: download_resources
	@$(MAKE) -j 2 web_server ollama_server

# Web Server
web_server:
	@python -m http.server --bind 127.0.0.1

# Ollama Server
ollama_server:
	@ollama serve

# Task to download resources
download_resources:
ifeq ($(OS),Windows_NT)
	@powershell -File download_resources.ps1
	@powershell -File check_hashes.ps1
else
	@if [ ! -d "resources" ]; then \
		mkdir -p ./resources/ && \
		cd ./resources/ && \
		curl -O https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css && \
		curl -O https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js && \
		curl -O https://cdn.jsdelivr.net/npm/marked@6.0.0/marked.min.js && \
		curl -O https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js; \
	fi
	@shasum -a 256 -c resources.hash || exit 1
endif

clean:
ifeq ($(OS),Windows_NT)
	@powershell -Command "Remove-Item -Recurse -Force resources"
else
	@rm -rf ./resources
endif
