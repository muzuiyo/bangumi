export type MediaType = 'game' | 'novel' | 'manga' | 'music' | 'tv' | 'movie' | 'anime'

export type Status = 'want' | 'doing' | 'done' | 'on_hold' | 'dropped'

export type Item = {
  id: number
  external_id?: string
  title: string
  media_type: MediaType
  status: Status
  rating?: number
  comment?: string
  created_at: string
  updated_at: string
}

export type ItemFormData = {
  external_id?: string
  title: string
  media_type: MediaType
  status: Status
  rating?: number
  comment?: string
  updated_at?: string
}

/** ---------------------------
 * 状态中文映射
 * --------------------------- */
export const StatusMap: Record<Status, string | Record<string, string>> = {
  want: {
    anime: '想看',
    movie: '想看',
    tv: '想看',
    novel: '想读',
    manga: '想读',
    game: '想玩',
    music: '想听'
  },
  doing: {
    anime: '在看',
    movie: '在看',
    tv: '在看',
    novel: '在读',
    manga: '在读',
    game: '在玩',
    music: '在听'
  },
  done: {
    anime: '看过',
    movie: '看过',
    tv: '看过',
    novel: '读过',
    manga: '读过',
    game: '玩过',
    music: '听过'
  },
  on_hold: '搁置',
  dropped: '抛弃'
}
