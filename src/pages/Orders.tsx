import { Layout } from '@/components/layout/Layout';
import { useGetOrders } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/api';
import { format } from 'date-fns';
import { Package, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

export default function Orders() {
  const { data, isLoading } = useGetOrders({ query: { page: 1, limit: 10 } } as any);

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-6">
          <div className="h-8 w-48 animate-pulse bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      </Layout>
    );
  }

  const orders = data?.orders || [];

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 rounded-full bg-muted/50 p-6">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-3xl font-medium">No orders yet</h2>
          <p className="mt-4 text-muted-foreground">When you place orders, they will appear here.</p>
          <Button className="mt-8 rounded-none px-8 font-medium uppercase tracking-widest" asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-medium md:text-4xl mb-10">Order History</h1>
        
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-sm">
                  <div>
                    <p className="font-medium uppercase tracking-wider text-muted-foreground text-[10px]">Order Number</p>
                    <p className="mt-1 font-medium">#{order.id.toString().padStart(6, '0')}</p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wider text-muted-foreground text-[10px]">Date Placed</p>
                    <p className="mt-1">{format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wider text-muted-foreground text-[10px]">Total Amount</p>
                    <p className="mt-1 font-medium">{formatPrice(order.total)}</p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wider text-muted-foreground text-[10px]">Status</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${
                        order.status === 'delivered' ? 'text-green-600' : 
                        order.status === 'processing' ? 'text-blue-600' :
                        order.status === 'cancelled' ? 'text-destructive' :
                        'text-amber-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {order.paymentStatus === 'paid' ? 'Paid via ' + (order.paymentMethod || 'Card') : 'Payment Pending'}
                </p>
                <Button variant="outline" size="sm" className="rounded-none uppercase tracking-widest text-xs" asChild>
                  <Link href={`/orders/${order.id}`}>
                    View Details <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}