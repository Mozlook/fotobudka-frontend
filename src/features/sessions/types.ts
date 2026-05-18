export type SessionStatus =
  | "draft"
  | "processing"
  | "selecting"
  | "waiting_for_payment"
  | "editing"
  | "delivered"
  | "closed"
  | "archived"
  | "failed"
  | string;

export type Currency = "PLN" | string;

export type PaymentMode = "manual" | "platform_future" | string;

export type PhotoStats = {
  total: number;
  pending_upload?: number;
  uploaded: number;
  processing: number;
  ready: number;
  failed: number;
};

export type PaymentSummary = {
  status?: string;
  amount_cents?: number;
  paid_at?: string | null;
};

export type DeliverySummary = {
  id?: string;
  version?: number;
  status?: string;
  zip_size_bytes?: number | null;
  generated_at?: string | null;
};

export type SessionSummary = {
  id: string;
  title: string;
  client_email?: string | null;
  status: SessionStatus;

  base_price_cents: number;
  included_count: number;
  extra_price_cents: number;
  min_select_count: number;
  currency: Currency;
  payment_mode: PaymentMode;

  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
  delete_after?: string | null;

  photo_stats?: PhotoStats;
  photos_stats?: PhotoStats;

  selected_count?: number;
  payment?: PaymentSummary | null;
  latest_delivery?: DeliverySummary | null;
};

export type CreateSessionInput = {
  title: string;
  client_email?: string;
  base_price_cents: number;
  included_count: number;
  extra_price_cents: number;
  min_select_count: number;
  currency: "PLN";
  payment_mode: "manual";
};

export type SessionAccessResult = {
  code: string;
  link: string;
  created_at?: string;
};

export type CreateSessionResult = {
  session: SessionSummary;
  access: SessionAccessResult | null;
};
