export type PropertyCategory =
  | "apartment"
  | "villa"
  | "detached"
  | "officetel"
  | "commercial"
  | "land";

export type MarketOutlook = "bullish" | "neutral" | "bearish";

export interface PropertyListItem {
  id: string;
  title: string;
  category: PropertyCategory;
  address: string;
  price: number;
  area_m2: number;
  rooms: number | null;
  bathrooms: number | null;
  is_premium: boolean;
  main_image_url: string | null;
  rating_avg: number;
  review_count: number;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnail_url: string | null;
  is_main: boolean;
  sort_order: number;
}

export interface PropertyBroker {
  id: string;
  name: string;
  avatar_url: string | null;
  office_name: string | null;
}

export interface PropertyReviewSummary {
  count: number;
  min_price: number | null;
  max_price: number | null;
  avg_rating: number | null;
}

export interface PropertyDetail {
  id: string;
  title: string;
  title_en: string | null;
  category: PropertyCategory;
  address: string;
  address_detail: string | null;
  region_code: string;
  latitude: number | null;
  longitude: number | null;
  price: number;
  area_m2: number;
  area_pyeong: number;
  rooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  build_year: number | null;
  description: string | null;
  checklist: Record<string, boolean>;
  status: string;
  is_premium: boolean;
  images: PropertyImage[];
  broker: PropertyBroker;
  reviews_summary: PropertyReviewSummary;
}

export interface ReviewAppraiser {
  id: string;
  name: string;
  avatar_url: string | null;
  years_of_experience: number | null;
  specialty: string | null;
  rating_avg: number | null;
}

export interface ReviewItem {
  id: string;
  appraiser: ReviewAppraiser;
  market_outlook: MarketOutlook;
  price: number;
  is_unlocked: boolean;
  purchased_at: string | null;
  published_at: string | null;
  rating_avg: number;
  rating_count: number;
  estimated_value_masked: string;
  confidence_level: "low" | "medium" | "high" | null;
  estimated_value: number | null;
  outlook_reason: string | null;
  analysis_summary: string | null;
  evidence_urls: string[] | null;
  disclaimer_field_visit: boolean | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  roles: ("buyer" | "appraiser" | "broker" | "admin")[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface Wallet {
  user_id: string;
  balance_tokens: number;
  total_charged: number;
  total_spent: number;
  total_earned: number;
  updated_at: string;
}

export interface TokenPackage {
  id: string;
  code: string;
  name: string;
  price_krw: number;
  tokens: number;
  bonus_tokens: number;
  sort_order: number;
  description: string | null;
}

export interface TokenTransaction {
  id: string;
  direction: "in" | "out";
  type: "charge" | "spend_review" | "earn_review_sale" | "refund" | "admin_adjust";
  tokens: number;
  balance_after: number;
  related_id: string | null;
  related_type: string | null;
  memo: string | null;
  created_at: string;
}

export interface ChargeResponse {
  payment_id: string;
  package: TokenPackage;
  granted_tokens: number;
  wallet: Wallet;
}

export interface ReviewPurchaseResult {
  id: string;
  review_id: string;
  price_tokens: number;
  platform_fee_tokens: number;
  appraiser_payout_tokens: number;
  unlocked_at: string;
  wallet_balance: number;
}

export interface PurchaseIntent {
  id: string;
  property_id: string;
  buyer_id: string;
  broker_id: string;
  offered_price: number;
  desired_close_date: string | null;
  message: string | null;
  status: "submitted" | "viewed" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
}

export interface AppraiserApplication {
  user_id: string;
  name: string;
  email: string;
  license_no: string;
  license_image_url: string;
  years_of_experience: number | null;
  specialty: string | null;
  bio: string | null;
  status: "pending" | "approved" | "rejected" | "revoked";
  rejection_reason: string | null;
  approved_at: string | null;
}

export interface BrokerApplication {
  user_id: string;
  name: string;
  email: string;
  office_name: string;
  license_no: string;
  office_address: string | null;
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
}
