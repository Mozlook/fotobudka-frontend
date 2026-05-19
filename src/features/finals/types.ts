export type FinalPresignFile = {
  photo_id: string
  filename: string
  mime_type: string
  size_bytes: number
}

export type PresignFinalUploadsInput = {
  files: FinalPresignFile[]
}

export type FinalUploadTarget = {
  final_id: string
  photo_id: string
  put_url: string
  object_key?: string
}

export type GenerateDeliveryZipResult = {
  delivery_id: string
  version: number
  status: string
}
