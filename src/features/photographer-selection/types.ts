export type PhotographerSelectedPhoto = {
  photo_id: string;
  original_filename: string;
  thumb_url?: string;
  proof_url?: string;
  note: string;
  selected_at?: string;
  final_id?: string | null;
  final_uploaded?: boolean;
};

export type PhotographerSelectionOverview = {
  session_id: string;
  session_status: string;
  selected_count: number;
  amount_cents: number | null;
  payment_status: string | null;
  payment_paid_at?: string | null;
  photos: PhotographerSelectedPhoto[];
};
