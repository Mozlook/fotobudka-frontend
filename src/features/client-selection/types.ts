export type ClientPhoto = {
  id: string;
  original_filename: string;
  thumb_url: string;
  selected: boolean;
  note: string;
  created_at?: string;
};

export type ClientPhotosPage = {
  photos: ClientPhoto[];
  offset: number;
  limit: number;
  total_count?: number;
  next_offset?: number;
  has_more: boolean;
};

export type SelectionUpdateItem = {
  photo_id: string;
  selected: boolean;
  note?: string;
};

export type UpdateSelectionsInput = {
  items: SelectionUpdateItem[];
};

export type ProofUrlResult = {
  proof_url: string;
};

export type SubmitSelectionResult = {
  status: "waiting_for_payment" | string;
  selected_count: number;
  amount_cents: number;
};

export type ClientSelectionDraftItem = {
  selected: boolean;
  note: string;
};

export type ClientSelectionDraft = Record<string, ClientSelectionDraftItem>;
