export const MEDIA_TYPES = [
  'game',
  'novel',
  'manga',
  'music',
  'tv',
  'movie',
  'anime'
] as const

export type MediaType = typeof MEDIA_TYPES[number]

export const MEDIA_STATUS = [
  'doing',      // 在看/在玩/在听
  'want',       // 想看/想玩/想听
  'done',       // 看过/玩过/听过
  'on_hold',    // 搁置
  'dropped'     // 抛弃
] as const

export type MediaStatus = typeof MEDIA_STATUS[number]
