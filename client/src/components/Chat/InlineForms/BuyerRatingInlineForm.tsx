// src/components/Chat/InlineForms/BuyerRatingInlineForm.tsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Star, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import SummaryApi from "../../../api/SummaryApi";
import type { RootState } from "../../../app/store";

interface BuyerRatingInlineFormProps {
  tradeId: string;
  sellerName?: string;
  sellerId?: string;
  onSubmit?: (rating: number, feedback?: string) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BuyerRatingInlineForm({
  tradeId,
  sellerName = "Seller",
  sellerId: _sellerId,
  onSubmit,
  onSuccess,
  onCancel,
}: BuyerRatingInlineFormProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // ---- Eligibility Check (COOKIE AUTH SAFE) ----
  useEffect(() => {
    if (!user) {
      setCanReview(false);
      setError("Please login to submit a review");
    } else {
      setCanReview(true);
    }
    setCheckingEligibility(false);
  }, [user]);

  // ---- Submit Review ----
  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (feedback.length > 500) {
      setError("Feedback must be 500 characters or less");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        SummaryApi.postSubmitReviewCompleteTrade(tradeId).url,
        {
          method: SummaryApi.postSubmitReviewCompleteTrade(tradeId).method,
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // 🔥 COOKIE AUTH
          body: JSON.stringify({
            rating,
            comment: feedback.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit review");
      }

      setSuccess(true);
      onSubmit?.(rating, feedback);

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSubmit?.(0, "");
    onCancel?.();
  };

  // ---- Loading ----
  if (checkingEligibility) {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
        <p className="text-white/60 text-sm">Checking review eligibility...</p>
      </div>
    );
  }

  // ---- Cannot Review ----
  if (canReview === false) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <XCircle className="w-5 h-5" />
          <h3 className="font-bold">Cannot Submit Review</h3>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <p className="text-white/80 text-sm">{error}</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  // ---- Success ----
  if (success) {
    return (
      <div className="space-y-4 text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-white font-bold text-xl">Review Submitted!</h3>
        <p className="text-white/80 text-sm">
          Thank you for rating {sellerName}
        </p>
        <div className="flex justify-center gap-1">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
          ))}
        </div>
      </div>
    );
  }

  // ---- Main Form ----
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500 fill-current" />
        <h3 className="font-bold text-white">Rate Your Experience</h3>
      </div>

      <div className="bg-white/10 rounded-xl p-3 border border-white/20">
        <p className="text-white/80 text-sm">You traded with:</p>
        <p className="text-white font-semibold text-lg">{sellerName}</p>
        <p className="text-white/60 text-xs mt-1">
          Trade #{tradeId.slice(0, 8)}...
        </p>
      </div>

      <div className="text-center">
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={submitting}
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoverRating || rating)
                    ? "text-yellow-500 fill-current"
                    : "text-white/30"
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-white/60 text-xs">
          {rating ? `${rating} out of 5 stars` : "Select a rating"}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white/60" />
          <label className="text-white/80 text-sm">Optional Feedback</label>
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={submitting}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white resize-none"
        />
        <p className="text-white/40 text-xs text-right">
          {feedback.length}/500
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-xl"
      >
        {submitting ? "Submitting..." : "Submit Rating"}
      </button>

      <button
        onClick={handleSkip}
        disabled={submitting}
        className="w-full text-white/60 hover:text-white text-sm"
      >
        Skip Rating
      </button>
    </div>
  );
}
