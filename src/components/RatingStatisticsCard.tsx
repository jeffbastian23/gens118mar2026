import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface RatingData {
  rating: number;
  count: number;
  label: string;
}

interface FeedbackItem {
  id: string;
  perihal: string;
  rating_penilaian: number;
  saran_feedback: string;
  rating_by: string;
  rating_at: string;
}

export interface RatingStatisticsCardRef {
  refresh: () => void;
}

const RatingStatisticsCard = forwardRef<RatingStatisticsCardRef>((_, ref) => {
  const [ratingStats, setRatingStats] = useState<RatingData[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRated, setTotalRated] = useState(0);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchRatingData
  }));

  useEffect(() => {
    fetchRatingData();
  }, []);

  const fetchRatingData = async () => {
    try {
      const { data: assignments, error } = await supabase
        .from("assignments")
        .select("id, perihal, rating_penilaian, saran_feedback, rating_by, rating_at")
        .not("rating_penilaian", "is", null);

      if (error) throw error;

      const ratingLabels = ['', 'Kurang', 'Cukup', 'Baik', 'Sangat Baik', 'Istimewa'];
      const ratingMap = new Map<number, number>();
      let totalRatingSum = 0;
      let totalRatedCount = 0;
      const feedbackList: FeedbackItem[] = [];

      (assignments || []).forEach((a: any) => {
        if (a.rating_penilaian && a.rating_penilaian >= 1 && a.rating_penilaian <= 5) {
          ratingMap.set(a.rating_penilaian, (ratingMap.get(a.rating_penilaian) || 0) + 1);
          totalRatingSum += a.rating_penilaian;
          totalRatedCount++;

          if (a.saran_feedback) {
            feedbackList.push({
              id: a.id,
              perihal: a.perihal,
              rating_penilaian: a.rating_penilaian,
              saran_feedback: a.saran_feedback,
              rating_by: a.rating_by,
              rating_at: a.rating_at,
            });
          }
        }
      });

      const stats = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingMap.get(rating) || 0,
        label: ratingLabels[rating]
      }));

      setRatingStats(stats);
      setAverageRating(totalRatedCount > 0 ? totalRatingSum / totalRatedCount : 0);
      setTotalRated(totalRatedCount);
      setFeedbacks(feedbackList.sort((a, b) => 
        new Date(b.rating_at).getTime() - new Date(a.rating_at).getTime()
      ).slice(0, 10));
    } catch (error) {
      console.error("Error fetching rating data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Statistik Penilaian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {totalRated === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada penilaian
            </p>
          ) : (
            <>
              {/* Average Rating */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <span className="text-sm font-medium">Rata-rata Rating</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                Total: {totalRated} penugasan dinilai
              </div>

              {/* Rating Distribution */}
              {ratingStats.map((stat) => (
                <div key={stat.rating} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= stat.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm">{stat.label}</span>
                  </div>
                  <span className="text-sm font-bold">{stat.count}</span>
                </div>
              ))}

              {/* Feedback Comments Section */}
              {feedbacks.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Komentar Terbaru</span>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {feedbacks.map((feedback) => (
                        <div 
                          key={feedback.id} 
                          className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${star <= feedback.rating_penilaian ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(feedback.rating_at), "dd MMM yyyy", { locale: id })}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 truncate">
                            {feedback.perihal}
                          </p>
                          <p className="text-sm italic">"{feedback.saran_feedback}"</p>
                          {feedback.rating_by && (
                            <p className="text-xs text-muted-foreground mt-1">
                              — {feedback.rating_by}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

RatingStatisticsCard.displayName = "RatingStatisticsCard";

export default RatingStatisticsCard;
