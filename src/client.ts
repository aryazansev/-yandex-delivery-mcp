export class YandexDeliveryClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = "https://b2b.taxi.yandex.net";
    this.apiKey = apiKey;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json",
      },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${data.message || response.statusText}`);
    }

    return data;
  }

  // ==================== БАЗОВЫЕ МЕТОДЫ ====================

  // Получить доступные варианты доставки
  async calculateOffers(params: {
    route_points: Array<{
      coordinates?: [number, number];
      fullname?: string;
      shortname?: string;
      uri?: string;
      country?: string;
      city?: string;
      street?: string;
      building?: string;
      comment?: string;
      contact?: {
        name?: string;
        phone?: string;
        phone_additional_code?: string;
      };
    }>;
    requirements?: {
      cargo_type?: string;
      cargo_options?: string[];
      taxi_class?: string;
      door_to_door?: boolean;
    };
    optional_return?: boolean;
    skip_door_to_door?: boolean;
    skip_emergency_notify?: boolean;
    due?: string;
  }): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/offers/calculate", params);
  }

  // Создать заявку
  async createClaim(params: {
    items?: Array<{
      title: string;
      cost_value?: string;
      cost_currency?: string;
      weight?: number;
      quantity?: number;
      size?: {
        length: number;
        width: number;
        height: number;
      };
    }>;
    route_points: Array<{
      coordinates?: [number, number];
      fullname?: string;
      shortname?: string;
      uri?: string;
      country?: string;
      city?: string;
      street?: string;
      building?: string;
      comment?: string;
      contact?: {
        name?: string;
        phone?: string;
        phone_additional_code?: string;
      };
      point_id?: number;
      type?: "source" | "destination" | "return";
      visit_order?: number;
      skip_confirmation?: boolean;
    }>;
    requirements?: {
      cargo_type?: string;
      cargo_options?: string[];
      taxi_class?: string;
      door_to_door?: boolean;
    };
    emergency_contact?: {
      name?: string;
      phone?: string;
    };
    client_requirements?: {
      taxi_class?: string;
      cargo_type?: string;
      cargo_options?: string[];
      door_to_door?: boolean;
    };
    skip_client_notify?: boolean;
    optional_return?: boolean;
    skip_door_to_door?: boolean;
    skip_emergency_notify?: boolean;
    due?: string;
    comment?: string;
    referral_source?: string;
  }): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/create", params);
  }

  // Получить информацию по заявке
  async getClaimInfo(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/info", { claim_id: claimId });
  }

  // Подтвердить заявку
  async acceptClaim(claimId: string, version: number): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/accept", {
      claim_id: claimId,
      version,
    });
  }

  // Получить информацию об условиях отмены
  async getCancelInfo(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/cancel-info", { claim_id: claimId });
  }

  // Отменить заявку
  async cancelClaim(claimId: string, version: number, cancel_state?: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/cancel", {
      claim_id: claimId,
      version,
      cancel_state,
    });
  }

  // ==================== СТОИМОСТЬ И ТАРИФЫ ====================

  // Получить первичную оценку стоимости
  async checkPrice(params: {
    route_points: Array<{
      coordinates?: [number, number];
      fullname?: string;
      shortname?: string;
      uri?: string;
    }>;
    requirements?: {
      cargo_type?: string;
      cargo_options?: string[];
      taxi_class?: string;
      door_to_door?: boolean;
    };
    optional_return?: boolean;
  }): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/check-price", params);
  }

  // Получить доступные тарифы
  async getTariffs(params: {
    start_point?: [number, number];
    end_point?: [number, number];
  }): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/tariffs", params);
  }

  // ==================== ОТСЛЕЖИВАНИЕ ЗАЯВКИ ====================

  // Получить номер телефона для звонка курьеру
  async getDriverVoiceForwarding(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/driver-voiceforwarding", {
      claim_id: claimId,
    });
  }

  // Получить координаты исполнителя
  async getPerformerPosition(claimId: string): Promise<any> {
    const url = `/b2b/cargo/integration/v2/claims/performer-position?claim_id=${encodeURIComponent(claimId)}`;
    return this.request("GET", url);
  }

  // Получить ETA точек
  async getPointsEta(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/points-eta", {
      claim_id: claimId,
    });
  }

  // Получить ссылки для отслеживания
  async getTrackingLinks(claimId: string): Promise<any> {
    const url = `/b2b/cargo/integration/v2/claims/tracking-links?claim_id=${encodeURIComponent(claimId)}`;
    return this.request("GET", url);
  }

  // ==================== КОД ПОДТВЕРЖДЕНИЯ ====================

  // Получить код подтверждения
  async getConfirmationCode(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/confirmation_code", {
      claim_id: claimId,
    });
  }

  // ==================== ПОДТВЕРЖДЕНИЕ ДОСТАВКИ ====================

  // Получить данные о подтверждении доставки
  async getProofOfDelivery(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/proof-of-delivery/info", {
      claim_id: claimId,
    });
  }

  // ==================== РЕДАКТИРОВАНИЕ ЗАКАЗА ====================

  // Изменить параметры заявки (до принятия оффера)
  async editClaim(
    claimId: string,
    version: number,
    params: {
      items?: Array<{
        title: string;
        cost_value?: string;
        cost_currency?: string;
        weight?: number;
        quantity?: number;
      }>;
      route_points?: Array<{
        coordinates?: [number, number];
        fullname?: string;
        contact?: {
          name?: string;
          phone?: string;
        };
      }>;
      requirements?: {
        taxi_class?: string;
        cargo_type?: string;
      };
      comment?: string;
    }
  ): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/edit", {
      claim_id: claimId,
      version,
      ...params,
    });
  }

  // Запросить частичное редактирование (после подтверждения)
  async applyChangesRequest(
    claimId: string,
    changes: Array<{
      point_id: number;
      contact?: {
        name?: string;
        phone?: string;
      };
      address?: {
        coordinates?: [number, number];
        fullname?: string;
      };
      skip_confirmation?: boolean;
    }>
  ): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/apply-changes/request", {
      claim_id: claimId,
      changes,
    });
  }

  // Получить результат применения изменений
  async applyChangesResult(claimId: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/apply-changes/result", {
      claim_id: claimId,
    });
  }

  // Инициировать возврат заказа
  async returnClaim(
    claimId: string,
    version: number,
    point_id?: number
  ): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/return", {
      claim_id: claimId,
      version,
      point_id,
    });
  }

  // ==================== ИНФОРМАЦИЯ ПО ЗАЯВКАМ ====================

  // Поиск заявок
  async searchClaims(params: {
    offset?: number;
    limit?: number;
    cursor?: string;
    sort?: string;
    created_from?: string;
    created_to?: string;
    updated_from?: string;
    updated_to?: string;
    statuses?: string[];
    phone?: string;
    claim_id?: string;
  }): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/search", params);
  }

  // Получить информацию по нескольким заявкам
  async getBulkInfo(claimIds: string[]): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/bulk_info", {
      claims: claimIds,
    });
  }

  // Получить историю изменений заявки
  async getClaimJournal(claimId: string, cursor?: string): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/claims/journal", {
      claim_id: claimId,
      cursor,
    });
  }

  // ==================== ДОСТАВКА В ТЕЧЕНИЕ ДНЯ ====================

  // Получить список услуг
  async getDeliveryMethods(params: {
    start_point?: [number, number];
  }): Promise<any> {
    return this.request("POST", "/b2b/cargo/integration/v2/delivery-methods", params);
  }
}
