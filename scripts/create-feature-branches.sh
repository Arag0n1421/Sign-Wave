#!/usr/bin/env bash
set -euo pipefail

git checkout main
git branch feature/recognition-engine
git branch feature/chat-llm-tts
git branch feature/ui-learn-mode
git branch feature/pwa-docs-pitch

echo "Created Sign Wave feature branches from main."
