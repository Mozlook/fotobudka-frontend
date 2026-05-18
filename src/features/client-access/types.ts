export type ClientSessionAccessResult = {
  id: string;
  title: string;
  status: string;
  base_price_cents: number;
  included_count: number;
  extra_price_cents: number;
  min_select_count: number;
  currency: string;
  payment_mode: string;
};

export type ClientAccessByCodeInput = {
  code: string;
  captcha_token?: string | null;
};
