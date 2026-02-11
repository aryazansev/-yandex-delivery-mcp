import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(homedir(), "yandex-delivery-mcp", ".env");
config({ path: envPath });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { YandexDeliveryClient } from "./client.js";

const YANDEX_DELIVERY_API_KEY = process.env.YANDEX_DELIVERY_API_KEY || "";

// Only check env vars when NOT using test server
if (!process.argv.includes('test-server.js') && !YANDEX_DELIVERY_API_KEY) {
  console.error("Error: YANDEX_DELIVERY_API_KEY must be set");
  console.error("Create .env file in ~/yandex-delivery-mcp/ with:");
  console.error("YANDEX_DELIVERY_API_KEY=your_api_key");
  process.exit(1);
}

const client = new YandexDeliveryClient(YANDEX_DELIVERY_API_KEY);

const server = new McpServer({
  name: "yandex-delivery-mcp",
  version: "1.0.0",
});

// ==================== БАЗОВЫЕ МЕТОДЫ ====================

// Инструмент: расчет вариантов доставки
server.tool(
  "calculate_offers",
  {
    route_points: z.array(z.object({
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      fullname: z.string().optional(),
      shortname: z.string().optional(),
      uri: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      street: z.string().optional(),
      building: z.string().optional(),
      comment: z.string().optional(),
      contact: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        phone_additional_code: z.string().optional(),
      }).optional(),
    })).describe("Точки маршрута (минимум 2)"),
    requirements: z.object({
      cargo_type: z.string().optional(),
      cargo_options: z.array(z.string()).optional(),
      taxi_class: z.string().optional(),
      door_to_door: z.boolean().optional(),
    }).optional().describe("Требования к доставке"),
    optional_return: z.boolean().optional().describe("Опциональный возврат"),
    due: z.string().optional().describe("Время подачи (ISO 8601)"),
  },
  async ({ route_points, requirements, optional_return, due }) => {
    const result = await client.calculateOffers({
      route_points,
      requirements,
      optional_return,
      due,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: создать заявку
server.tool(
  "create_claim",
  {
    route_points: z.array(z.object({
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      fullname: z.string().optional(),
      shortname: z.string().optional(),
      uri: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      street: z.string().optional(),
      building: z.string().optional(),
      comment: z.string().optional(),
      contact: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        phone_additional_code: z.string().optional(),
      }).optional(),
      point_id: z.number().optional(),
      type: z.enum(["source", "destination", "return"]).optional(),
      visit_order: z.number().optional(),
      skip_confirmation: z.boolean().optional(),
    })).describe("Точки маршрута"),
    items: z.array(z.object({
      title: z.string().describe("Название товара"),
      cost_value: z.string().optional(),
      cost_currency: z.string().optional(),
      weight: z.number().optional(),
      quantity: z.number().optional(),
      size: z.object({
        length: z.number(),
        width: z.number(),
        height: z.number(),
      }).optional(),
    })).optional().describe("Товары"),
    requirements: z.object({
      cargo_type: z.string().optional(),
      cargo_options: z.array(z.string()).optional(),
      taxi_class: z.string().optional(),
      door_to_door: z.boolean().optional(),
    }).optional(),
    emergency_contact: z.object({
      name: z.string(),
      phone: z.string(),
    }).optional(),
    comment: z.string().optional(),
    due: z.string().optional(),
  },
  async (params) => {
    const result = await client.createClaim(params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: получить информацию по заявке
server.tool(
  "get_claim_info",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getClaimInfo(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: подтвердить заявку
server.tool(
  "accept_claim",
  {
    claim_id: z.string().describe("ID заявки"),
    version: z.number().describe("Версия заявки"),
  },
  async ({ claim_id, version }) => {
    const result = await client.acceptClaim(claim_id, version);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: отменить заявку
server.tool(
  "cancel_claim",
  {
    claim_id: z.string().describe("ID заявки"),
    version: z.number().describe("Версия заявки"),
    cancel_state: z.string().optional().describe("Состояние отмены"),
  },
  async ({ claim_id, version, cancel_state }) => {
    const result = await client.cancelClaim(claim_id, version, cancel_state);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== СТОИМОСТЬ И ТАРИФЫ ====================

// Инструмент: проверить стоимость
server.tool(
  "check_price",
  {
    route_points: z.array(z.object({
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      fullname: z.string().optional(),
      shortname: z.string().optional(),
      uri: z.string().optional(),
    })).describe("Точки маршрута"),
    requirements: z.object({
      cargo_type: z.string().optional(),
      cargo_options: z.array(z.string()).optional(),
      taxi_class: z.string().optional(),
      door_to_door: z.boolean().optional(),
    }).optional(),
    optional_return: z.boolean().optional(),
  },
  async (params) => {
    const result = await client.checkPrice(params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: получить тарифы
server.tool(
  "get_tariffs",
  {
    start_point: z.tuple([z.number(), z.number()]).optional().describe("Координаты начальной точки [lat, lon]"),
    end_point: z.tuple([z.number(), z.number()]).optional().describe("Координаты конечной точки [lat, lon]"),
  },
  async (params) => {
    const result = await client.getTariffs(params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== ОТСЛЕЖИВАНИЕ ====================

// Инструмент: получить телефон курьера
server.tool(
  "get_driver_phone",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getDriverVoiceForwarding(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: получить позицию курьера
server.tool(
  "get_performer_position",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getPerformerPosition(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: получить ETA точек
server.tool(
  "get_points_eta",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getPointsEta(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: получить ссылки для отслеживания
server.tool(
  "get_tracking_links",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getTrackingLinks(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== КОД ПОДТВЕРЖДЕНИЯ ====================

server.tool(
  "get_confirmation_code",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getConfirmationCode(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== ПОДТВЕРЖДЕНИЕ ДОСТАВКИ ====================

server.tool(
  "get_proof_of_delivery",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.getProofOfDelivery(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== РЕДАКТИРОВАНИЕ ====================

// Инструмент: редактировать заявку
server.tool(
  "edit_claim",
  {
    claim_id: z.string().describe("ID заявки"),
    version: z.number().describe("Текущая версия заявки"),
    items: z.array(z.object({
      title: z.string(),
      cost_value: z.string().optional(),
      cost_currency: z.string().optional(),
      weight: z.number().optional(),
      quantity: z.number().optional(),
    })).optional(),
    route_points: z.array(z.object({
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      fullname: z.string().optional(),
      contact: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
      }).optional(),
    })).optional(),
    comment: z.string().optional(),
  },
  async (params) => {
    const { claim_id, version, ...updateData } = params;
    const result = await client.editClaim(claim_id, version, updateData);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: запросить изменения
server.tool(
  "apply_changes_request",
  {
    claim_id: z.string().describe("ID заявки"),
    changes: z.array(z.object({
      point_id: z.number().describe("ID точки"),
      contact: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
      }).optional(),
      address: z.object({
        coordinates: z.tuple([z.number(), z.number()]).optional(),
        fullname: z.string().optional(),
      }).optional(),
      skip_confirmation: z.boolean().optional(),
    })).describe("Список изменений"),
  },
  async ({ claim_id, changes }) => {
    const result = await client.applyChangesRequest(claim_id, changes);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: получить результат изменений
server.tool(
  "apply_changes_result",
  {
    claim_id: z.string().describe("ID заявки"),
  },
  async ({ claim_id }) => {
    const result = await client.applyChangesResult(claim_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: инициировать возврат
server.tool(
  "return_claim",
  {
    claim_id: z.string().describe("ID заявки"),
    version: z.number().describe("Версия заявки"),
    point_id: z.number().optional().describe("ID точки возврата"),
  },
  async ({ claim_id, version, point_id }) => {
    const result = await client.returnClaim(claim_id, version, point_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== ПОИСК И ИНФОРМАЦИЯ ====================

// Инструмент: поиск заявок
server.tool(
  "search_claims",
  {
    offset: z.number().optional().describe("Смещение"),
    limit: z.number().optional().describe("Лимит результатов"),
    cursor: z.string().optional().describe("Курсор для пагинации"),
    created_from: z.string().optional().describe("Дата создания от (ISO 8601)"),
    created_to: z.string().optional().describe("Дата создания до (ISO 8601)"),
    statuses: z.array(z.string()).optional().describe("Статусы заявок"),
    phone: z.string().optional().describe("Телефон для поиска"),
  },
  async (params) => {
    const result = await client.searchClaims(params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: массовая информация по заявкам
server.tool(
  "get_bulk_info",
  {
    claim_ids: z.array(z.string()).describe("Список ID заявок"),
  },
  async ({ claim_ids }) => {
    const result = await client.getBulkInfo(claim_ids);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Инструмент: история заявки
server.tool(
  "get_claim_journal",
  {
    claim_id: z.string().describe("ID заявки"),
    cursor: z.string().optional().describe("Курсор для пагинации"),
  },
  async ({ claim_id, cursor }) => {
    const result = await client.getClaimJournal(claim_id, cursor);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ==================== ДОСТАВКА В ТЕЧЕНИЕ ДНЯ ====================

server.tool(
  "get_delivery_methods",
  {
    start_point: z.tuple([z.number(), z.number()]).optional().describe("Координаты начальной точки [lat, lon]"),
  },
  async (params) => {
    const result = await client.getDeliveryMethods(params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Export function to create server (for HTTP usage)
export async function createServer() {
  return server;
}

// Запуск сервера (для stdio)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Yandex Delivery MCP Server running on stdio");
}

// Run as stdio server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
