#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 serve.py
fi
echo 'Python 3 was not found. Install Python 3, then try again.'
read -r -p 'Press Return to close.'
