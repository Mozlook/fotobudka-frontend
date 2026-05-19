export type ClientDeliveryDownload = {
  delivery_id: string
  version: number
  download_url: string
  zip_size_bytes?: number | null
  generated_at?: string | null
}
