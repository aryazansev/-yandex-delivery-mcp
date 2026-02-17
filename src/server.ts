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
import { z } from "zod";
import { YandexDeliveryClient } from "./client.js";

const app = express();
const PORT = Number(process.env.PORT) || Number(process.env.MCP_PORT) || 3002;

const YANDEX_DELIVERY_API_KEY = process.env.YANDEX_DELIVERY_API_KEY || "";

if (!YANDEX_DELIVERY_API_KEY) {
  console.error("Error: YANDEX_DELIVERY_API_KEY must be set");
  process.exit(1);
}

const client = new YandexDeliveryClient(YANDEX_DELIVERY_API_KEY);

// Define tools schema
const toolsSchema = {
  calculate_offers: {
    description: "Рассчитать варианты доставки",
    parameters: z.object({
      route_points: z.array(z.any()),
      requirements: z.object({}).optional(),
      optional_return: z.boolean().optional(),
      due: z.string().optional(),
    }),
    handler: async (params: any) => {
      return await client.calculateOffers(params);
    }
  },
  create_claim: {
    description: "Создать заявку на доставку",
    parameters: z.object({
      route_points: z.array(z.any()),
      items: z.array(z.any()).optional(),
      requirements: z.object({}).optional(),
      emergency_contact: z.object({}).optional(),
      comment: z.string().optional(),
      due: z.string().optional(),
    }),
    handler: async (params: any) => {
      return await client.createClaim(params);
    }
  },
  get_claim_info: {
    description: "Получить информацию о заявке",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      console.log(`[get_claim_info] params:`, params, "claim_id:", params?.claim_id);
      return await client.getClaimInfo(params.claim_id);
    }
  },
  accept_claim: {
    description: "Подтвердить заявку",
    parameters: z.object({
      claim_id: z.string(),
      version: z.number(),
    }),
    handler: async (params: any) => {
      return await client.acceptClaim(params.claim_id, params.version);
    }
  },
  cancel_claim: {
    description: "Отменить заявку",
    parameters: z.object({
      claim_id: z.string(),
      version: z.number(),
      cancel_state: z.string().optional(),
    }),
    handler: async (params: any) => {
      return await client.cancelClaim(params.claim_id, params.version, params.cancel_state);
    }
  },
  check_price: {
    description: "Проверить стоимость доставки",
    parameters: z.object({
      route_points: z.array(z.any()),
      requirements: z.object({}).optional(),
      optional_return: z.boolean().optional(),
    }),
    handler: async (params: any) => {
      return await client.checkPrice(params);
    }
  },
  get_tariffs: {
    description: "Получить доступные тарифы",
    parameters: z.object({
      start_point: z.tuple([z.number(), z.number()]).optional(),
      end_point: z.tuple([z.number(), z.number()]).optional(),
    }),
    handler: async (params: any) => {
      return await client.getTariffs(params);
    }
  },
  get_driver_phone: {
    description: "Получить номер телефона курьера",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.getDriverVoiceForwarding(params.claim_id);
    }
  },
  get_performer_position: {
    description: "Получить позицию курьера",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.getPerformerPosition(params.claim_id);
    }
  },
  get_points_eta: {
    description: "Получить ETA для точек маршрута",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.getPointsEta(params.claim_id);
    }
  },
  get_tracking_links: {
    description: "Получить ссылки для отслеживания",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.getTrackingLinks(params.claim_id);
    }
  },
  get_confirmation_code: {
    description: "Получить код подтверждения",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.getConfirmationCode(params.claim_id);
    }
  },
  get_proof_of_delivery: {
    description: "Получить данные о подтверждении доставки",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.getProofOfDelivery(params.claim_id);
    }
  },
  edit_claim: {
    description: "Редактировать заявку",
    parameters: z.object({
      claim_id: z.string(),
      version: z.number(),
      items: z.array(z.any()).optional(),
      route_points: z.array(z.any()).optional(),
      comment: z.string().optional(),
    }),
    handler: async (params: any) => {
      const { claim_id, version, ...updateData } = params;
      return await client.editClaim(claim_id, version, updateData);
    }
  },
  apply_changes_request: {
    description: "Запросить изменения в заявке",
    parameters: z.object({
      claim_id: z.string(),
      changes: z.array(z.any()),
    }),
    handler: async (params: any) => {
      return await client.applyChangesRequest(params.claim_id, params.changes);
    }
  },
  apply_changes_result: {
    description: "Получить результат изменений",
    parameters: z.object({
      claim_id: z.string(),
    }),
    handler: async (params: any) => {
      return await client.applyChangesResult(params.claim_id);
    }
  },
  return_claim: {
    description: "Инициировать возврат заказа",
    parameters: z.object({
      claim_id: z.string(),
      version: z.number(),
      point_id: z.number().optional(),
    }),
    handler: async (params: any) => {
      return await client.returnClaim(params.claim_id, params.version, params.point_id);
    }
  },
  search_claims: {
    description: "Поиск заявок",
    parameters: z.object({
      offset: z.number().optional(),
      limit: z.number().optional(),
      cursor: z.string().optional(),
      created_from: z.string().optional(),
      created_to: z.string().optional(),
      statuses: z.array(z.string()).optional(),
      phone: z.string().optional(),
      external_order_id: z.string().optional().describe("Внешний номер заказа (например LO-793770465)"),
    }),
    handler: async (params: any) => {
      return await client.searchClaims(params);
    }
  },
  get_bulk_info: {
    description: "Получить информацию о нескольких заявках",
    parameters: z.object({
      claim_ids: z.array(z.string()),
    }),
    handler: async (params: any) => {
      return await client.getBulkInfo(params.claim_ids);
    }
  },
  get_claim_journal: {
    description: "Получить историю заявки",
    parameters: z.object({
      claim_id: z.string(),
      cursor: z.string().optional(),
    }),
    handler: async (params: any) => {
      return await client.getClaimJournal(params.claim_id, params.cursor);
    }
  },
  get_delivery_methods: {
    description: "Получить список доступных услуг",
    parameters: z.object({
      start_point: z.tuple([z.number(), z.number()]).optional(),
    }),
    handler: async (params: any) => {
      return await client.getDeliveryMethods(params);
    }
  },
};

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

// Parse JSON for all routes
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
  const tools = Object.entries(toolsSchema).map(([name, tool]: [string, any]) => ({
    name,
    description: tool.description,
    inputSchema: tool.parameters ? { type: "object", properties: {} } : { type: "object" }
  }));

  res.json({
    name: "yandex-delivery-mcp",
    version: "1.0.0",
    description: "Yandex Delivery integration for AI assistants - manage deliveries, track couriers, and handle orders",
    author: "aryazansev",
    homepage: "https://github.com/aryazansev/-yandex-delivery-mcp",
    transport: "json-rpc-http",
    endpoints: {
      mcp: `/mcp`,
      health: `/health`,
      manifest: `/manifest`
    },
    capabilities: {
      tools: tools.map(t => t.name)
    },
    setup: {
      required_env: ["YANDEX_DELIVERY_API_KEY"],
      optional_env: ["MCP_PORT"]
    }
  });
});

// List tools endpoint
app.get('/tools', (req, res) => {
  const tools = Object.entries(toolsSchema).map(([name, tool]: [string, any]) => ({
    name,
    description: tool.description,
    inputSchema: { type: "object", properties: {} }
  }));
  
  res.json({ tools });
});

// MCP JSON-RPC endpoint
app.post('/mcp', async (req, res) => {
  console.log(`[MCP] RAW body:`, JSON.stringify(req.body, null, 2));
  console.log(`[MCP] RAW params:`, JSON.stringify(req.body?.params, null, 2));
  
  try {
    const { method, params, id } = req.body;
    
    // Handle tools/list method
    if (method === 'tools/list') {
      const tools = Object.entries(toolsSchema).map(([name, tool]: [string, any]) => ({
        name,
        description: tool.description,
        inputSchema: { type: "object", properties: {} }
      }));
      
      return res.json({
        jsonrpc: "2.0",
        result: { tools },
        id
      });
    }
    
    // Handle tools/call method
    if (method === 'tools/call') {
      console.log(`[MCP] params:`, JSON.stringify(params, null, 2));
      const toolParams = params.arguments || params;
      const { name } = params;
      const tool = (toolsSchema as any)[name];
      
      console.log(`[MCP] tool: ${name}, toolParams:`, JSON.stringify(toolParams, null, 2));
      
      if (!tool) {
        return res.status(404).json({
          jsonrpc: "2.0",
          error: { code: -32601, message: `Tool '${name}' not found` },
          id
        });
      }
      
      try {
        console.log(`[MCP] Calling tool handler with:`, JSON.stringify(toolParams, null, 2));
        const result = await tool.handler(toolParams || {});
        return res.json({
          jsonrpc: "2.0",
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          },
          id
        });
      } catch (error) {
        console.error(`[MCP] Tool execution error:`, error);
        return res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Tool execution failed'
          },
          id
        });
      }
    }
    
    // Unknown method
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method '${method}' not found` },
      id
    });
    
  } catch (error) {
    console.error('[MCP] Error handling request:', error);
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      },
      id: req.body?.id
    });
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
