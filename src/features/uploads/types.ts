export type SourcePhotoPresignFile = {
  filename: string
  mime_type: string
  size_bytes: number
}

export type SourcePhotoUploadTarget = {
  photo_id: string
  put_url: string
  object_key?: string
}

export type PresignSourcePhotosInput = {
  files: SourcePhotoPresignFile[]
}
