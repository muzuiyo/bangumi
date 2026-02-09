import { MediaStatus, MediaType } from "../constants"

export type Item = {
  id: number
  external_id?: string   // 外部唯一ID，可选
  title: string
  media_type: MediaType
  status: MediaStatus
  rating?: number        // 0~10，可选
  comment?: string
  created_at: string
  updated_at: string
}

