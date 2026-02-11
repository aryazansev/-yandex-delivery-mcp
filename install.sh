#!/bin/bash

# Yandex Delivery MCP Server - Installation Script

set -e

echo "🚀 Installing Yandex Delivery MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install globally
echo "📦 Installing package..."
npm install -g yandex-delivery-mcp

# Create config directory
CONFIG_DIR="$HOME/.yandex-delivery-mcp"
mkdir -p "$CONFIG_DIR"

# Create .env.example
cat > "$CONFIG_DIR/.env.example" << 'EOF'
# Yandex Delivery API Key
YANDEX_DELIVERY_API_KEY=your_api_key_here

# Server Port (optional, default: 3002)
MCP_PORT=3002
EOF

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the example config:"
echo "   cp $CONFIG_DIR/.env.example $CONFIG_DIR/.env"
echo ""
echo "2. Edit the config and add your API key:"
echo "   nano $CONFIG_DIR/.env"
echo ""
echo "3. For Claude Desktop, add to your config:"
echo '   ~/Library/Application\ Support/Claude/claude_desktop_config.json'
echo ""
echo "4. For HTTP server mode, run:"
echo "   yandex-delivery-mcp-server"
echo ""
