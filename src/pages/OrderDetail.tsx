import { Layout } from '@/components/layout/Layout';
import { useGetOrder } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/api';
import { format } from 'date-fns';
import { Package, Truck, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function OrderDetail({ params }: { params: { id: string } }) {
  const { data: order, isLoading } = useGetOrder(Number(params.id));

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 animate-pulse space-y-8">
          <div className="h-10 w-64 bg-muted" />
          <div className="h-32 bg-muted" />
          <div className="h-64 bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return <Layout><div className="p-20 text-center">Order not found</div></Layout>;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-medium">Order #{order.id.toString().padStart(6, '0')}</h1>
            <p className="text-muted-foreground mt-2">Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          <Button variant="outline" className="rounded-none uppercase tracking-widest text-xs" onClick={() => window.print()}>
            Print Invoice
          </Button>
        </div>

        {/* Status Timeline */}
        <div className="bg-card border border-border p-6 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-6">Order Status</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -z-10 -translate-y-1/2" />
            
            {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
              const isActive = 
                (step === 'pending') ||
                (step === 'processing' && ['processing', 'shipped', 'delivered'].includes(order.status)) ||
                (step === 'shipped' && ['shipped', 'delivered'].includes(order.status)) ||
                (step === 'delivered' && order.status === 'delivered');
                
              return (
                <div key={step} className="flex flex-col items-center gap-2 bg-card px-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
                    {step === 'delivered' ? <CheckCircle2 className="h-4 w-4" /> : 
                     step === 'shipped' ? <Truck className="h-4 w-4" /> : 
                     <Package className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs uppercase tracking-wider font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="border border-border bg-card">
              <h2 className="text-sm font-semibold uppercase tracking-wider p-4 border-b border-border bg-muted/30">Items</h2>
              <div className="divide-y divide-border">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-4 p-4">
                    <div className="h-20 w-16 bg-muted shrink-0">
                      <img src={item.product.imageUrl || ''} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${item.productId}`} className="font-medium hover:text-primary/70">{item.product.name}</Link>
                      {item.selectedVariants && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Object.values(item.selectedVariants).join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-border bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal || order.total)}</span>
                </div>
                {order.discount ? (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted-foreground border-b border-border pb-4">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-medium pt-1 text-base">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="border border-border bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Shipping Address</h2>
              {order.shippingAddress ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="pt-2">{order.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Address details unavailable</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}