import { useState } from 'react'
import type { ItemsTableRow } from './itemsTable'
import { useAuth } from '@/contexts/authContext'
import { deleteItem, updateItem } from '@/lib/api/items'
import './infoCard.css'
import { MediaType, Status } from '@/interfaces/items'

type Props = {
	item: ItemsTableRow
	onClose?: () => void
}

const infCardStatusOptions: Record<string, string[]> = {
	anime: ['想看', '在看', '看过', '搁置', '抛弃'],
	movie: ['想看', '在看', '看过', '搁置', '抛弃'],
	tv: ['想看', '在看', '看过', '搁置', '抛弃'],
	novel: ['想读', '在读', '读过', '搁置', '抛弃'],
	manga: ['想读', '在读', '读过', '搁置', '抛弃'],
	game: ['想玩', '在玩', '玩过', '搁置', '抛弃'],
	music: ['想听', '在听', '听过', '搁置', '抛弃']
}

const mediaTypeToValue: Record<string, MediaType> = {
    动画: 'anime',
    电影: 'movie',
    电视剧: 'tv',
    小说: 'novel',
    漫画: 'manga',
    游戏: 'game',
    音乐: 'music'
}

const statusToValue: Record<string, string> = {
	'想看': 'want',
	'在看': 'doing',
	'看过': 'done',
	'想读': 'want',
	'在读': 'doing',
	'读过': 'done',
	'想玩': 'want',
	'在玩': 'doing',
	'玩过': 'done',
	'想听': 'want',
	'在听': 'doing',
	'听过': 'done',
	'搁置': 'on_hold',
	'抛弃': 'dropped'
}

const InfoCard = ({ item, onClose }: Props) => {
	const { isAuthenticated } = useAuth()
	const [isEditing, setIsEditing] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
	const [formData, setFormData] = useState({
		title: item.title,
		mediaType: mediaTypeToValue[item.mediaType] || 'anime',
		status: statusToValue[item.status] || 'want',
		rating: item.rating ?? '',
		comment: item.comment ?? ''
	})
	const renderCommentWithLinks = (comment: string) => {
		const urlRegex = /(https?:\/\/[^\s]+)/g
		const parts = comment.split(urlRegex)

		return parts.map((part, index) => {
			if (urlRegex.test(part)) {
				return (
					<a
						key={`${part}-${index}`}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						className="comment-link"
					>
						外部链接
					</a>
				)
			}
			return <span key={`${part}-${index}`}>{part}</span>
		})
	}

	const getStatusOptions = () => {
		const mediaType = (formData.mediaType as keyof typeof infCardStatusOptions) || 'anime'
		return infCardStatusOptions[mediaType] || infCardStatusOptions.anime
	}

	const handleEdit = () => {
		setIsEditing(true)
	}

	const handleUpdate = async () => {
		// TODO: 实现更新函数
		// console.log('更新数据:', formData)
		setIsEditing(false)
        setIsUpdating(true)
        try {
            // 前端验证
            const ratingNum = formData.rating ? Number(formData.rating) : undefined
            if (ratingNum !== undefined && (ratingNum < 0 || ratingNum > 10)) {
                alert('评分必须在 0-10 之间')
                setIsUpdating(false)
                setIsEditing(true)
                return
            }

            console.log('更新数据:', formData)
            await updateItem(
                { id: item.id }, 
                {
                    title: formData.title,
                    media_type: formData.mediaType as MediaType,
                    status: formData.status as Status,
                    rating: ratingNum,
                    comment: formData.comment || undefined
                }
            )
            window.location.reload()
        } catch (error) {
            console.error('更新条目失败:', error)
            alert('更新失败：' + (error instanceof Error ? error.message : '未知错误'))
            setIsEditing(true)
        } finally {
            setIsUpdating(false)
        }
	}

	const handleDelete = async () => {
		if (!window.confirm(`确定要删除「${item.title}」吗？此操作无法撤销。`)) {
			return
		}

		try {
			setIsDeleting(true)
			await deleteItem({ id: item.id })
			onClose?.()
			window.location.reload()
		} catch (error) {
			console.error('删除项目失败:', error)
			alert('删除失败，请重试')
		} finally {
			setIsDeleting(false)
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
					{isEditing ? (
						<input
							type="text"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							className="info-card-title-input"
						/>
					) : (
						<div className="info-card-title" title={item.title}>
							{item.title}
						</div>
					)}
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

					{isEditing ? (
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
					) : (
						<div className="info-card-value">{item.mediaType}</div>
					)}
					{isEditing ? (
						<select
							value={formData.status}
							onChange={(e) => setFormData({ ...formData, status: e.target.value })}
							className="info-card-input"
						>
							{getStatusOptions().map((status) => (
								<option key={status} value={statusToValue[status]}>
									{status}
								</option>
							))}
						</select>
					) : (
						<div className="info-card-value">{item.status}</div>
					)}
					{isEditing ? (
						<input
							type="number"
							min="0"
							max="10"
							value={formData.rating}
							onChange={(e) => setFormData({ ...formData, rating: e.target.value ? Number(e.target.value) : '' })}
							className="info-card-input"
						/>
					) : (
						<div className="info-card-value">{formData.rating || 'N/A'}</div>
					)}
				</div>

				<div className="info-card-section">
					<div className="info-card-label">评论</div>
					{isEditing ? (
						<textarea
							rows={3}
							value={formData.comment}
							onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
							className="info-card-input info-card-textarea"
						/>
					) : (
						<div className="info-card-value info-card-comment">
							{formData.comment ? renderCommentWithLinks(formData.comment) : 'N/A'}
						</div>
					)}
				</div>

				<div className="info-card-footer">
					<div className="info-card-label">更新时间</div>
					<div className="info-card-value">{item.updatedAt}</div>
					<div className="info-card-id">#{item.id}</div>
				</div>

				{isAuthenticated && (
					<div className="info-card-actions">
						<button
							type="button"
							className={`info-card-btn ${isEditing ? 'update-btn' : 'edit-btn'}`}
							onClick={isEditing ? handleUpdate : handleEdit}
							disabled={isDeleting || isUpdating}
						>
							{isUpdating ? '保存中...' : isEditing ? '更新' : '编辑'}
						</button>
						<button
							type="button"
							className="info-card-btn delete-btn"
							onClick={handleDelete}
							disabled={isDeleting || isEditing || isUpdating}
						>
							{isDeleting ? '删除中...' : '删除'}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default InfoCard
