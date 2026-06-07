import { useState } from 'react';
import { courierService } from '../../services/api';
import './CourierReviewModal.css';

interface CourierReviewModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const CourierReviewModal = ({
  isOpen,
  orderId,
  onClose,
  onSubmitted,
}: CourierReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Пожалуйста, выберите оценку');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await courierService.submitReviewByOrder({
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data ?? err?.message;
      setError(typeof msg === 'string' ? msg : 'Не удалось отправить отзыв');
    } finally {
      setLoading(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];
  const activeRating = hovered || rating;

  const starLabel = ['', 'Плохо', 'Не очень', 'Нормально', 'Хорошо', 'Отлично!'];

  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <button className="review-close" onClick={onClose}>×</button>

        <div className="review-header">
          <div className="review-icon">⭐</div>
          <h2 className="review-title">Оцените курьера</h2>
          <p className="review-subtitle">Ваш заказ доставлен. Расскажите о впечатлениях.</p>
        </div>

        <div className="review-stars">
          {stars.map(s => (
            <button
              key={s}
              className={`star-btn ${s <= activeRating ? 'star-active' : ''}`}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => { setRating(s); setError(null); }}
              aria-label={`${s} звезд`}
            >
              ★
            </button>
          ))}
        </div>

        {activeRating > 0 && (
          <div className="review-star-label">{starLabel[activeRating]}</div>
        )}

        <div className="review-comment-wrap">
          <label className="review-comment-label">Комментарий (необязательно)</label>
          <textarea
            className="review-comment"
            placeholder="Всё прошло отлично, спасибо!"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="review-comment-count">{comment.length}/500</div>
        </div>

        {error && <div className="review-error">⚠️ {error}</div>}

        <div className="review-actions">
          <button className="review-skip" onClick={onClose} disabled={loading}>
            Пропустить
          </button>
          <button
            className="review-submit"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? <span className="review-spinner" /> : 'Отправить отзыв'}
          </button>
        </div>
      </div>
    </div>
  );
};
