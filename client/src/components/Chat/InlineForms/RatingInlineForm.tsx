// src/components/Chat/InlineForms/RatingInlineForm.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInlineFormProps {
  onSubmit: (rating: number, comment: string) => void;
}

export default function RatingInlineForm({ onSubmit }: RatingInlineFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    onSubmit(rating, comment);
  };

  return (
    <div className="flex justify-start mb-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 max-w-md shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-600" />
          <h3 className="font-bold text-gray-900">Rate Your Experience</h3>
        </div>

        {/* Star Rating */}
        <div className="flex gap-2 mb-3 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className={`text-3xl transition-all ${
                star <= (hoveredStar || rating)
                  ? 'text-yellow-400 scale-110'
                  : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          placeholder="Share your experience (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  );
}
