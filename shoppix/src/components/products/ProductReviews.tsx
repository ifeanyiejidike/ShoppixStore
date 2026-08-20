"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewsApi } from "@/lib/api/reviews";
import type { Review } from "@/lib/types";
import { formatDate, getApiErrorMessage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${starSize} ${n <= rating ? "fill-marigold text-marigold" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    reviewsApi
      .listForProduct(productId)
      .then(({ data }) => setReviews(data.results))
      .catch(() => setReviews([]));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.create(productId, rating, comment || undefined);
      toast.success("Thanks for your review!");
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't submit your review."));
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="font-display text-2xl italic text-ink">Reviews</h2>
        {reviews && reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating)} size="md" />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews.length})
            </span>
          </div>
        )}
      </div>

      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium text-ink">Leave a review</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Only available if you&apos;ve purchased this product.
          </p>
          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    n <= rating ? "fill-marigold text-marigold" : "text-border hover:text-marigold/50"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your experience with this product (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" className="mt-3" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      )}

      {reviews === null ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your experience.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border pb-5 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <StarRating rating={review.rating} />
                {review.is_verified_purchase && (
                  <span className="rounded-full bg-jade-soft px-2 py-0.5 text-[11px] font-medium text-jade">
                    Verified purchase
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink">{review.user_email}</p>
              {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
