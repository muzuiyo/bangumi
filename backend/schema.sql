-- ====== 主表：记录条目 ======

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 外部唯一ID（给自动化脚本用，比如bangumi id / url hash）
  external_id TEXT UNIQUE,

  title TEXT NOT NULL,

  -- 类型：game / novel / manga / music / tv / movie / anime
  media_type TEXT NOT NULL CHECK (media_type IN (
    'game',
    'novel',
    'manga',
    'music',
    'tv',
    'movie',
    'anime'
  )),

  -- 状态
  status TEXT NOT NULL CHECK (status IN (
    'want',     -- 想看
    'doing',    -- 在看
    'done',     -- 完成
    'on_hold',  -- 搁置
    'dropped'   -- 抛弃
  )),

  rating INTEGER CHECK (rating >= 0 AND rating <= 10),

  comment TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- ====== 索引（非常重要，后面查询会快很多） ======

CREATE INDEX IF NOT EXISTS idx_items_status
ON items(status);

CREATE INDEX IF NOT EXISTS idx_items_type
ON items(media_type);

CREATE INDEX IF NOT EXISTS idx_items_external
ON items(external_id);
