import { apiClient, USE_MOCK } from "@/lib/api";
import type { PropertyDetail, PropertyListItem, ReviewItem } from "@/lib/types";
import { MOCK_PROPERTIES, MOCK_PROPERTY_DETAIL, MOCK_REVIEWS } from "@/mocks/properties";

export interface ListParams {
  q?: string;
  category?: string;
  region_code?: string;
  price_min?: number;
  price_max?: number;
  page?: number;
  size?: number;
}

export async function fetchProperties(params: ListParams = {}): Promise<{
  data: PropertyListItem[];
  meta: { page: number; size: number; total: number };
}> {
  if (USE_MOCK) {
    const filtered = MOCK_PROPERTIES.filter((p) => {
      if (params.category && params.category !== "all" && p.category !== params.category) return false;
      if (params.q) {
        const q = params.q.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return { data: filtered, meta: { page: 1, size: filtered.length, total: filtered.length } };
  }
  const { data } = await apiClient.get("/properties", { params });
  return data;
}

export async function fetchPropertyDetail(id: string): Promise<PropertyDetail> {
  if (USE_MOCK) {
    const detail = MOCK_PROPERTY_DETAIL[id] ?? MOCK_PROPERTY_DETAIL.p1;
    if (!detail) throw new Error("Mock property not found");
    return detail;
  }
  const { data } = await apiClient.get<PropertyDetail>(`/properties/${id}`);
  return data;
}

export async function fetchPropertyReviews(propertyId: string): Promise<ReviewItem[]> {
  if (USE_MOCK) {
    return MOCK_REVIEWS[propertyId] ?? MOCK_REVIEWS.p1 ?? [];
  }
  const { data } = await apiClient.get<{ data: ReviewItem[] }>(
    `/properties/${propertyId}/reviews`,
  );
  return data.data;
}

export async function purchaseReview(reviewId: string) {
  const { data } = await apiClient.post(`/reviews/${reviewId}/purchase`);
  return data;
}

export interface CreatePropertyInput {
  title: string;
  title_en?: string;
  category: string;
  address: string;
  address_detail?: string;
  region_code: string;
  latitude?: number;
  longitude?: number;
  price: number;
  area_m2: number;
  rooms?: number;
  bathrooms?: number;
  parking?: number;
  build_year?: number;
  description?: string;
  checklist?: Record<string, boolean>;
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyDetail> {
  const { data } = await apiClient.post<PropertyDetail>("/properties", input);
  return data;
}

export async function fetchMyListings(): Promise<PropertyListItem[]> {
  const { data } = await apiClient.get<PropertyListItem[]>("/broker/properties");
  return data;
}

export async function submitIntent(
  propertyId: string,
  input: { offered_price: number; desired_close_date?: string; message?: string },
) {
  const { data } = await apiClient.post(`/properties/${propertyId}/intents`, input);
  return data;
}

export async function fetchMyIntents() {
  const { data } = await apiClient.get("/me/intents");
  return data;
}

export async function fetchBrokerIntents() {
  const { data } = await apiClient.get("/broker/intents");
  return data;
}
