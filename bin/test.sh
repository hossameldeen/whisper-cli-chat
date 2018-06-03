#!/usr/bin/env bash
docker build -t hossameldeen/whisper-cli-chat:latest . && docker run --rm -v /var/run/docker.sock:/var/run/docker.sock hossameldeen/whisper-cli-chat:latest npm test
