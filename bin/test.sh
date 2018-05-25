#!/usr/bin/env bash
docker build -t hossameldeen/whisper-cli-chat:latest . && docker run --rm hossameldeen/whisper-cli-chat:latest npm test
