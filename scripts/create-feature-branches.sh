#!/usr/bin/env bash
set -euo pipefail

git checkout main
git branch feature/recognition-engine
git branch feature/chat-llm-phrase-builder
git branch feature/realtime-ui-learn-mode
git branch feature/pwa-docs-demo-pack

echo "Created Sign Wave feature branches from main."
