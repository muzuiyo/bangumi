import { useState } from 'react'
import { useAuth } from '@/contexts/authContext'
import { MediaType, Status } from '@/interfaces/items'
import { createItem } from '@/lib/api/items'
import './infoCard.css'

type Props = {
  onClose?: () => void
}

const cardStatusOptions: Record<string, string[]> = {
  anime: ['想看', '在看', '看过', '搁置', '抛弃'],
  movie: ['想看', '在看', '看过', '搁置', '抛弃'],
  tv: ['想看', '在看', '看过', '搁置', '抛弃'],
  novel: ['想读', '在读', '读过', '搁置', '抛弃'],
  manga: ['想读', '在读', '读过', '搁置', '抛弃'],
  game: ['想玩', '在玩', '玩过', '搁置', '抛弃'],
  music: ['想听', '在听', '听过', '搁置', '抛弃']
}

const statusToValue: Record<string, Status> = {
  想看: 'want',
  在看: 'doing',
  看过: 'done',
  想读: 'want',
  在读: 'doing',
  读过: 'done',
  想玩: 'want',
  在玩: 'doing',
  玩过: 'done',
  想听: 'want',
  在听: 'doing',
  听过: 'done',
  搁置: 'on_hold',
  抛弃: 'dropped'
}

const NewCard = ({ onClose }: Props) => {
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    mediaType: 'anime' as MediaType,
    status: 'want' as Status,
    rating: '',
    comment: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const getStatusOptions = () => {
    const mediaType = (formData.mediaType as keyof typeof cardStatusOptions) || 'anime'
    return cardStatusOptions[mediaType] || cardStatusOptions.anime
  }

  const handleCreate = async () => {
    // 验证标题
    if (!formData.title.trim()) {
      alert('请输入标题')
      return
    }

    // 验证评分
    if (formData.rating) {
      const ratingNum = Number(formData.rating)
      if (ratingNum < 0 || ratingNum > 10) {
        alert('评分必须在 0-10 之间')
        return
      }
    }

    setIsCreating(true)
    try {
      const ratingNum = formData.rating ? Number(formData.rating) : undefined
      
      await createItem({
        title: formData.title,
        media_type: formData.mediaType,
        status: formData.status,
        rating: ratingNum,
        comment: formData.comment || undefined
      })

      // 新增成功后刷新页面
      window.location.reload()
    } catch (error) {
      console.error('新增条目失败:', error)
      alert('新增失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div
      className="info-card-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="info-card" onClick={(event) => event.stopPropagation()}>
        <div className="info-card-header">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="info-card-title-input"
            placeholder="输入标题"
          />
          {onClose && (
            <button
              type="button"
              className="info-card-close"
              onClick={onClose}
              aria-label="关闭"
            >
              ✕
            </button>
          )}
        </div>

        <div className="info-card-grid">
          <div className="info-card-label">类型</div>
          <div className="info-card-label">状态</div>
          <div className="info-card-label">评分</div>

          <select
            value={formData.mediaType}
            onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as MediaType })}
            className="info-card-input"
          >
            <option value="anime">动画</option>
            <option value="movie">电影</option>
            <option value="tv">电视剧</option>
            <option value="novel">小说</option>
            <option value="manga">漫画</option>
            <option value="game">游戏</option>
            <option value="music">音乐</option>
          </select>

          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
            className="info-card-input"
          >
            {getStatusOptions().map((status) => (
              <option key={status} value={statusToValue[status]}>
                {status}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            max="10"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value || '' })}
            className="info-card-input"
          />
        </div>

        <div className="info-card-section">
          <div className="info-card-label">评论</div>
          <textarea
            rows={3}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="info-card-input info-card-textarea"
          />
        </div>

        {isAuthenticated && (
          <div className="info-card-actions">
            <button
              type="button"
              className="info-card-btn update-btn"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? '新增中...' : '新增'}
            </button>
            {onClose && (
              <button
                type="button"
                className="info-card-btn delete-btn"
                onClick={onClose}
              >
                取消
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewCard
