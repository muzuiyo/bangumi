import { useState, type ReactNode } from 'react'
import InfoCard from './infoCard'
import './itemsTable.css'

export type ItemsTableRow = {
  id: number
  title: string
  mediaType: string
  status: string
  rating?: number | null
  comment?: string | null
  updatedAt: string
}

type Props = {
  items: ItemsTableRow[]
  emptyText?: ReactNode
}

const typeClassMap: Record<string, string> = {
  动画: 'badge-type-anime',
  电影: 'badge-type-movie',
  电视剧: 'badge-type-tv',
  小说: 'badge-type-novel',
  漫画: 'badge-type-manga',
  游戏: 'badge-type-game',
  音乐: 'badge-type-music'
}

const statusClassMap: Record<string, string> = {
  想看: 'badge-status-planned',
  想读: 'badge-status-planned',
  想玩: 'badge-status-planned',
  想听: 'badge-status-planned',
  在看: 'badge-status-doing',
  在读: 'badge-status-doing',
  在玩: 'badge-status-doing',
  在听: 'badge-status-doing',
  看过: 'badge-status-done',
  读过: 'badge-status-done',
  玩过: 'badge-status-done',
  听过: 'badge-status-done',
  搁置: 'badge-status-hold',
  抛弃: 'badge-status-drop'
}

const renderCommentWithLinks = (comment: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = comment.split(urlRegex)

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="comment-link"
        >
          外部链接
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}

const ItemsTable = ({ items, emptyText = '暂无记录' }: Props) => {
  const [activeItem, setActiveItem] = useState<ItemsTableRow | null>(null)

  return (
    <>
      <table className="items-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>
              标题&nbsp;
              <span
                className="items-table-hint"
                title="点击标题查看详细信息"
                aria-label="点击标题查看详细信息"
              >
                ⓘ
              </span>
            </th>
            <th>类型</th>
            <th>状态</th>
            <th>评分</th>
            <th>评论</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7}>{emptyText}</td>
            </tr>
          ) : (
            items.map((row, index) => (
              <tr key={`${row.id}-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <button
                    type="button"
                    className="items-table-title-button"
                    onClick={() => setActiveItem(row)}
                  >
                    {row.title}
                  </button>
                </td>
                <td>
                  <span className={`badge ${typeClassMap[row.mediaType] ?? 'badge-neutral'}`}>
                    {row.mediaType}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statusClassMap[row.status] ?? 'badge-neutral'}`}>
                    {row.status}
                  </span>
                </td>
                <td>{row.rating ?? 'N/A'}</td>
                <td>{row.comment ? renderCommentWithLinks(row.comment) : 'N/A'}</td>
                <td>{row.updatedAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {activeItem ? <InfoCard item={activeItem} onClose={() => setActiveItem(null)} /> : null}
    </>
  )
}

export default ItemsTable
