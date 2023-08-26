.PHONY: default download_resources web_server ollama_server

# Default task that downloads the assets and starts the ollama and web server
default: download_resources
	@$(MAKE) -j 2 web_server ollama_server

# Web Server
web_server:
	python3 -m http.server

# Web Server
ollama_server:
	ollama serve

# Task to download resources
download_resources:
	# Check if resources directory exists, if not create it
	@if [ ! -d "resources" ]; then \
		mkdir -p ./resources/ && \
		cd ./resources/ && \
		curl -O https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css && \
		curl -O https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js && \
		curl -O https://cdn.jsdelivr.net/npm/marked@6.0.0/marked.min.js && \
		curl -O https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js; \
	fi
	# Check SHA-256 hash
	@shasum -a 256 -c resources.hash || exit 1

clean:
	@rm -rf ./resources
