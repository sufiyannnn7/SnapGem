import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageSquare, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderDetails = location.state?.order;

  if (!orderDetails) {
    return (
      <div className="pt-32 pb-16 min-h-[60vh] flex flex-col items-center justify-center bg-background text-center px-4">
        <h2 className="text-3xl font-serif font-medium mb-4">Order Placed</h2>
        <p className="text-muted-foreground mb-8">Thank you for shopping with us!</p>
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/90 transition-colors"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const { order, addressData, items, total, totalMRP, totalSavings, waUrl } = orderDetails;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold tracking-widest uppercase text-green-600 mb-2 block">
            Order Placed Successfully
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">
            Thank You, {addressData.full_name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Your order <strong className="text-foreground">#{order.order_number || order.id?.slice(0, 8)}</strong> has been recorded. WhatsApp has opened with your order summary to arrange payment.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {waUrl && (
              <a 
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-full font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                <MessageSquare className="w-5 h-5" /> Open WhatsApp Chat Again
              </a>
            )}
            <Link 
              to="/shop" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border px-8 py-4 rounded-full font-medium hover:bg-secondary transition-colors"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Order Details Card */}
        <div className="bg-secondary/30 rounded-2xl p-6 md:p-8 border border-border">
          <div className="flex justify-between items-center pb-6 border-b border-border mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Order Reference</p>
              <p className="text-lg font-bold font-mono">#{order.order_number || order.id?.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
              <span className="inline-block bg-amber-500/10 text-amber-600 font-semibold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider mt-1">
                Pending Payment
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Delivery Address</h3>
            <p className="font-medium text-foreground">{addressData.full_name} ({addressData.phone})</p>
            <p className="text-sm text-muted-foreground">
              {addressData.address_line_1}{addressData.address_line_2 ? `, ${addressData.address_line_2}` : ''}
              {addressData.landmark ? `, Landmark: ${addressData.landmark}` : ''}
            </p>
            <p className="text-sm text-muted-foreground">{addressData.city}, {addressData.state} - {addressData.pincode}</p>
          </div>

          {/* Items Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ordered Items</h3>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-lg overflow-hidden shrink-0">
                      <img src={item.thumbnail || ''} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">₹{(item.selling_price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total MRP</span>
              <span>₹{totalMRP.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Total Discount</span>
                <span>-₹{totalSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 text-foreground">
              <span>Grand Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
