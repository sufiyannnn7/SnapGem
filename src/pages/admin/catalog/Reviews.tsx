import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { reviewService } from '@/services/reviewService';

export function Reviews() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin_reviews'],
    queryFn: reviewService.getAllReviewsAdmin
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_approved }: { id: string, is_approved: boolean }) => 
      reviewService.updateReviewStatus(id, is_approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reviews'] });
      toast.success('Review status updated');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: reviewService.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reviews'] });
      toast.success('Review deleted');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const filteredReviews = reviews.filter((r: any) => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
          <p className="text-muted-foreground mt-2">Manage customer reviews and ratings.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b">
                <tr>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Review</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : filteredReviews.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">No reviews found.</td></tr>
                ) : (
                  filteredReviews.map((review: any) => (
                    <tr key={review.id} className="border-b last:border-0 hover:bg-secondary/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           {review.product?.thumbnail && (
                             <div className="h-10 w-10 bg-secondary rounded-md overflow-hidden shrink-0">
                               <img src={review.product.thumbnail} alt="" className="w-full h-full object-cover" />
                             </div>
                           )}
                           <p className="font-medium line-clamp-2 max-w-[150px]">{review.product?.name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-yellow-500 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-zinc-300 dark:text-zinc-700'}`} />
                          ))}
                        </div>
                        <p className="font-medium">{review.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{review.comment}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{review.reviewer_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {review.is_approved ? (
                           <Button variant="ghost" size="icon" title="Reject" onClick={() => updateStatusMutation.mutate({ id: review.id, is_approved: false })}>
                             <XCircle className="h-4 w-4 text-orange-500" />
                           </Button>
                        ) : (
                           <Button variant="ghost" size="icon" title="Approve" onClick={() => updateStatusMutation.mutate({ id: review.id, is_approved: true })}>
                             <CheckCircle className="h-4 w-4 text-green-500" />
                           </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => {
                          if(confirm('Delete this review forever?')) deleteMutation.mutate(review.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
