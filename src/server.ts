import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(homedir(), "yandex-delivery-mcp", ".env");
config({ path: envPath });

import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getServer } from './server-instance.js';

const app = express();
const PORT = Number(process.env.PORT) || Number(process.env.MCP_PORT) || 3002;

// Enable CORS for AI Studio and other clients
app.use(cors({
  origin: [
    'https://ai.anthropic.com',
    'https://claude.ai',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Parse JSON bodies
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Yandex Delivery MCP Server",
    status: "running",
    endpoints: {
      health: "/health",
      manifest: "/manifest",
      mcp: "/mcp"
    }
  });
});

// MCP Server manifest endpoint for discovery
app.get('/manifest', (req, res) => {
  res.json({
    name: "yandex-delivery-mcp",
    version: "1.0.0",
    description: "Yandex Delivery integration for AI assistants - manage deliveries, track couriers, and handle orders",
    author: "aryazansev",
    homepage: "https://github.com/aryazansev/-yandex-delivery-mcp",
    transport: "streamable-http",
    endpoints: {
      mcp: `/mcp`,
      health: `/health`,
      manifest: `/manifest`
    },
    capabilities: {
      tools: [
        "calculate_offers",
        "create_claim",
        "get_claim_info",
        "accept_claim",
        "cancel_claim",
        "check_price",
        "get_tariffs",
        "get_driver_phone",
        "get_performer_position",
        "get_points_eta",
        "get_tracking_links",
        "get_confirmation_code",
        "get_proof_of_delivery",
        "edit_claim",
        "apply_changes_request",
        "apply_changes_result",
        "return_claim",
        "search_claims",
        "get_bulk_info",
        "get_claim_journal",
        "get_delivery_methods"
      ]
    },
    setup: {
      required_env: ["YANDEX_DELIVERY_API_KEY"],
      optional_env: ["MCP_PORT"]
    }
  });
});

// Store transports by session ID
const transports = new Map();

// MCP Streamable HTTP endpoint
app.all('/mcp', async (req, res) => {
  console.log(`[MCP] ${req.method} request to /mcp`);
  console.log(`[MCP] Headers:`, JSON.stringify(req.headers, null, 2));
  
  try {
    // Get or create server instance
    const server = await getServer();
    
    // Get session ID from header or query
    const sessionId = req.headers['mcp-session-id'] || req.query.sessionId || 'default';
    
    let transport = transports.get(sessionId);
    
    if (!transport) {
      console.log(`[MCP] Creating new transport for session: ${sessionId}`);
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => String(sessionId),
      });
      
      await server.connect(transport);
      transports.set(sessionId, transport);
      
      console.log(`[MCP] Transport created and connected`);
    }
    
    // Handle the request
    await transport.handleRequest(req, res, req.body);
    
  } catch (error) {
    console.error('[MCP] Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        },
        id: null
      });
    }
  }
});

// Start HTTP server
async function startServer() {
  try {
    console.log('🚀 Starting Yandex Delivery MCP Server...');
    console.log('📍 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      YANDEX_DELIVERY_API_KEY: process.env.YANDEX_DELIVERY_API_KEY ? '✅ Set' : '❌ Missing'
    });
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Yandex Delivery MCP Server running on HTTP port ${PORT}`);
      console.log(`📋 Manifest: http://localhost:${PORT}/manifest`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log(`🔗 MCP Endpoint: http://localhost:${PORT}/mcp`);
      console.log('');
      console.log('🔗 To connect with AI Studio:');
      console.log(`   Use this URL: http://localhost:${PORT}/manifest`);
      console.log('');
      console.log('🌐 Repository: https://github.com/aryazansev/-yandex-delivery-mcp');
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Yandex Delivery MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Yandex Delivery MCP Server...');
  process.exit(0);
});

startServer();
