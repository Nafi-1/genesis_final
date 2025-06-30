#!/bin/bash

# Agent Service Setup Script
# This script sets up the AI agent service

echo "Setting up AI Agent Service..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Run the Python setup script
python3 setup.py

echo "Agent service setup completed."