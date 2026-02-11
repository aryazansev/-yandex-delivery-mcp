import express from 'express';
import cors from 'cors';
import { createServer } from './index.js';

const app = express();
const PORT = Number(process.env.PORT) || Number(process.env.MCP_PORT) || 3002;

// Health check before anything else (no dependencies)
app.get('/health', (req, res) => {
  try {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.MCP_PORT || 3002
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', error: 'Health check failed' });
  }
});

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Yandex Delivery MCP Server",
    status: "running",
    endpoints: {
      health: "/health",
      manifest: "/manifest",
      tools: "/tools",
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
    author: "yourname",
    homepage: "https://github.com/yourusername/yandex-delivery-mcp",
    transport: "http",
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

// Create and start MCP server
async function startServer() {
  try {
    console.log('🚀 Starting Yandex Delivery MCP Server...');
    console.log('📍 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.MCP_PORT || 3002,
      YANDEX_DELIVERY_API_KEY: process.env.YANDEX_DELIVERY_API_KEY ? '✅ Set' : '❌ Missing'
    });
    
    // Create MCP server instance
    const mcpServer = await createServer();
    
    // Mount MCP server on /mcp endpoint
    app.use('/mcp', async (req, res) => {
      try {
        res.json({
          status: 'MCP Server running',
          endpoints: {
            tools: '/tools',
            manifest: '/manifest'
          }
        });
      } catch (error) {
        console.error('MCP Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // List all available tools
    app.get('/tools', async (req, res) => {
      try {
        res.json({
          tools: [
            {
              name: "calculate_offers",
              description: "Calculate available delivery options and prices",
              inputSchema: {
                type: "object",
                properties: {
                  route_points: { 
                    type: "array", 
                    description: "Route points (minimum 2)" 
                  },
                  requirements: { 
                    type: "object", 
                    description: "Delivery requirements" 
                  }
                },
                required: ["route_points"]
              }
            },
            {
              name: "create_claim",
              description: "Create a new delivery claim/order",
              inputSchema: {
                type: "object",
                properties: {
                  route_points: { type: "array" },
                  items: { type: "array" },
                  requirements: { type: "object" }
                },
                required: ["route_points"]
              }
            },
            {
              name: "get_claim_info",
              description: "Get detailed information about a claim",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string", description: "Claim ID" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "accept_claim",
              description: "Accept a delivery offer",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" },
                  version: { type: "number" }
                },
                required: ["claim_id", "version"]
              }
            },
            {
              name: "cancel_claim",
              description: "Cancel an existing claim",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" },
                  version: { type: "number" }
                },
                required: ["claim_id", "version"]
              }
            },
            {
              name: "check_price",
              description: "Check delivery price without creating a claim",
              inputSchema: {
                type: "object",
                properties: {
                  route_points: { type: "array" }
                },
                required: ["route_points"]
              }
            },
            {
              name: "get_tariffs",
              description: "Get available tariffs for a location",
              inputSchema: {
                type: "object",
                properties: {
                  start_point: { type: "array", description: "Coordinates [lat, lon]" }
                }
              }
            },
            {
              name: "get_driver_phone",
              description: "Get courier phone number for calling",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "get_performer_position",
              description: "Get courier current position and movement data",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "get_points_eta",
              description: "Get estimated time of arrival for route points",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "get_tracking_links",
              description: "Get tracking links for courier tracking",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "get_confirmation_code",
              description: "Get confirmation code for current point",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "get_proof_of_delivery",
              description: "Get delivery confirmation data",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            },
            {
              name: "edit_claim",
              description: "Edit claim parameters before acceptance",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" },
                  version: { type: "number" }
                },
                required: ["claim_id", "version"]
              }
            },
            {
              name: "search_claims",
              description: "Search for claims with filters",
              inputSchema: {
                type: "object",
                properties: {
                  limit: { type: "number" },
                  statuses: { type: "array" },
                  phone: { type: "string" }
                }
              }
            },
            {
              name: "get_claim_journal",
              description: "Get claim history/changelog",
              inputSchema: {
                type: "object",
                properties: {
                  claim_id: { type: "string" }
                },
                required: ["claim_id"]
              }
            }
          ]
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ Yandex Delivery MCP Server running on HTTP port ${PORT}`);
      console.log(`📋 Manifest: http://localhost:${PORT}/manifest`);
      console.log(`🔧 Tools: http://localhost:${PORT}/tools`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log(`🔗 MCP Endpoint: http://localhost:${PORT}/mcp`);
      console.log('');
      console.log('🔗 To connect with AI Studio:');
      console.log(`   Use this URL: http://localhost:${PORT}/manifest`);
      console.log('');
      console.log('🌐 Repository: https://github.com/yourusername/yandex-delivery-mcp');
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    console.log('🏥 Health check ready on /health');

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
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

// Start the server
startServer();
