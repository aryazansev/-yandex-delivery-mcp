#!/bin/bash

# Start Yandex Delivery MCP Server

# Load environment variables from config directory
if [ -f "$HOME/.yandex-delivery-mcp/.env" ]; then
    export $(cat "$HOME/.yandex-delivery-mcp/.env" | xargs)
fi

# Start the server
node build/server.js
