#!/bin/bash

make download_resources

OUTPUT_ZIP="ollama-ui.zip"

zip "$OUTPUT_ZIP" ./*.js ./*.css ./*.json ./*.html ./*.png resources/

echo "Files have been zipped as $OUTPUT_ZIP"
