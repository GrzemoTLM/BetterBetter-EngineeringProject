#!/bin/bash
cd "$(dirname "$0")/.."
if [ -f ".venv/bin/activate" ]; then
    .venv/bin/python -m pytest tests/ -v
else
    python3 -m pytest tests/ -v
fi
