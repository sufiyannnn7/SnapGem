import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { storeSettingsService } from '@/services/storeSettingsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Printer, CheckCircle2, Clock, Truck, ShieldCheck, XCircle, Send, AlertTriangle, QrCode, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin_order_detail', id],
    queryFn: async () => {
      if (!id) return null;
      const allOrders = await orderService.getAdminOrders();
      return allOrders.find((o: any) => o.id === id) || null;
    },
    enabled: !!id
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!id) return;
      return orderService.updateOrder(id, updates, order);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin_order_detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      
      if (variables.payment_status) {
        toast.success(`Payment status updated to ${variables.payment_status.toUpperCase()}`);
      } else if (variables.status) {
        toast.success(`Order status updated to ${variables.status.toUpperCase()}`);
      } else {
        toast.success('Order updated successfully');
      }
    },
    onError: (e: any) => toast.error(`Failed to update order: ${e.message}`)
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading order details...</div>;
  if (!order) return <div className="p-12 text-center text-muted-foreground">Order not found.</div>;

  const custPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const orderNum = order.order_number || `SG-ORD-${order.id.slice(0, 6)}`;
  const databaseGrandTotal = Number(order.total || 0);
  const storeName = settings?.site_name || 'SnapGem Store';

  // Open WhatsApp to Send Payment QR & Verification
  const openSendPaymentQRWhatsApp = () => {
    let msg = `🛍️ *${storeName}*\n\n`;
    msg += `Hi ${order.customer_name || 'Customer'},\n\n`;
    msg += `Thank you for your order *#${orderNum}*!\n\n`;
    msg += `*AMOUNT TO COLLECT:* ₹${databaseGrandTotal.toFixed(2)}\n\n`;
    msg += `Please find our payment QR / UPI details below to complete your order payment.\n\n`;
    msg += `Once paid, please reply with your payment screenshot. Thank you!`;

    window.open(`https://wa.me/${custPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Handle Payment Status Selection
  const handlePaymentStatusChange = (newStatus: string) => {
    if (newStatus === 'paid') {
      setPendingPaymentStatus('paid');
      setShowConfirmModal(true);
    } else {
      updateOrderMutation.mutate({ payment_status: newStatus });
    }
  };

  const confirmPaidStatus = () => {
    if (pendingPaymentStatus) {
      updateOrderMutation.mutate({ payment_status: pendingPaymentStatus });
    }
    setShowConfirmModal(false);
    setPendingPaymentStatus(null);
  };

  // Generate Status Notification Messages for WhatsApp
  const generateStatusWAMessage = (statusType: string) => {
    let msg = `🛍️ *${storeName}*\n\n`;

    switch (statusType) {
      case 'confirmed':
        msg += `Hi ${order.customer_name}, your order *#${orderNum}* has been *CONFIRMED*! 🎉\n`;
        msg += `Amount: ₹${databaseGrandTotal.toFixed(2)}\n`;
        msg += `We are preparing your package. Thank you!`;
        break;
      case 'packed':
        msg += `Hi ${order.customer_name}, your order *#${orderNum}* is now *PACKED* and ready for dispatch! 📦`;
        break;
      case 'shipped':
        msg += `Hi ${order.customer_name}, your order *#${orderNum}* has been *SHIPPED*! 🚚\n`;
        msg += `Expected delivery soon. Thank you for shopping with ${storeName}!`;
        break;
      case 'delivered':
        msg += `Hi ${order.customer_name}, your order *#${orderNum}* has been *DELIVERED*! 🎁\n`;
        msg += `We hope you love your purchase. Thank you!`;
        break;
      case 'cancelled':
        msg += `Hi ${order.customer_name}, your order *#${orderNum}* has been *CANCELLED*.\n`;
        msg += `Please contact support for queries.`;
        break;
      default:
        msg += `Hi ${order.customer_name}, update regarding your order *#${orderNum}*...`;
    }

    return encodeURIComponent(msg);
  };

  const openWhatsAppStatusNotif = (statusType: string) => {
    const text = generateStatusWAMessage(statusType);
    window.open(`https://wa.me/${custPhone}?text=${text}`, '_blank');
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0;">${item.product?.name || item.product_name || 'Product'}</td>
        <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right;">₹${(item.price || item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold;">₹${((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${orderNum}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; max-width: 700px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .info-block { margin-bottom: 25px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: #666; }
            .total-row { text-align: right; font-size: 18px; font-weight: bold; padding-top: 15px; border-top: 2px solid #111; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${storeName} Invoice</div>
              <p style="color: #666; font-size: 12px; margin-top: 5px;">Order #${orderNum}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: bold;">Date: ${format(new Date(order.created_at), 'dd MMM yyyy')}</p>
              <p style="color: #666; font-size: 12px; margin-top: 5px;">Payment: ${(order.payment_status || 'pending').toUpperCase()}</p>
            </div>
          </div>

          <div class="info-block">
            <h4 style="margin: 0 0 5px 0; text-transform: uppercase; font-size: 11px; color: #666;">Customer Details:</h4>
            <p style="margin: 0; font-bold; font-size: 16px;">${order.customer_name || 'Customer'}</p>
            <p style="margin: 0; color: #555;">Phone: ${order.customer_phone}</p>
            <p style="margin: 0; color: #555;">
              ${order.address_line_1 || ''} ${order.address_line_2 || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}
            </p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; line-height: 1.8;">
            <p style="margin: 0;">Subtotal: ₹${(order.subtotal || 0).toFixed(2)}</p>
            <p style="margin: 0;">Shipping: ${order.shipping === 0 ? 'FREE' : '₹' + (order.shipping || 0).toFixed(2)}</p>
            <p class="total-row" style="margin-top: 10px;">Grand Total: ₹${databaseGrandTotal.toFixed(2)}</p>
          </div>

          <div style="margin-top: 50px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you for shopping with ${storeName}!
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Back & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={printInvoice}>
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5"
            onClick={openSendPaymentQRWhatsApp}
          >
            <QrCode className="w-4 h-4" /> Send Payment QR
          </Button>
        </div>
      </div>

      {/* CRITICAL SECURITY BANNER: Authoritative Database Order Total */}
      <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block">
              DATABASE ORDER TOTAL (AUTHORITATIVE SOURCE OF TRUTH)
            </span>
            <div className="text-3xl font-extrabold text-foreground mt-1">
              ₹{databaseGrandTotal.toFixed(2)}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-700 dark:text-green-400 font-bold hover:bg-green-500/10"
              onClick={openSendPaymentQRWhatsApp}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" /> Open Customer WhatsApp
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Payment amount is calculated from the saved website order, not from WhatsApp.</span>
        </p>
      </div>

      {/* Main Order Card */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Order Reference</span>
              <h2 className="text-2xl font-bold font-mono">#{orderNum}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Placed on {format(new Date(order.created_at), 'PPP, hh:mm a')}
              </p>
            </div>

            {/* Payment & Order Status Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Payment Status</span>
                <select
                  className={`border rounded-xl px-3 py-1.5 text-xs font-bold uppercase cursor-pointer ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : order.payment_status === 'failed'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : order.payment_status === 'refunded'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                  value={order.payment_status || 'pending'}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                >
                  <option value="pending">Payment Pending</option>
                  <option value="paid">Payment Received (Paid)</option>
                  <option value="failed">Payment Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Order Status</span>
                <select
                  className="border rounded-xl px-3 py-1.5 text-xs font-bold uppercase bg-background cursor-pointer"
                  value={order.status || 'pending'}
                  onChange={(e) => updateOrderMutation.mutate({ status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          
          {/* Amount to Collect Summary Box */}
          <div className="border rounded-2xl p-5 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AMOUNT TO COLLECT FROM CUSTOMER</span>
              <h3 className="text-2xl font-bold text-foreground">₹{databaseGrandTotal.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">Send payment QR/UPI details via WhatsApp to complete order fulfillment.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-bold text-green-700 border-green-600 hover:bg-green-50"
                onClick={openSendPaymentQRWhatsApp}
              >
                <MessageSquare className="w-4 h-4 text-green-600" /> Open Customer WhatsApp
              </Button>
            </div>
          </div>

          {/* Quick Auto WhatsApp Status Notification Bar */}
          <div className="bg-secondary/30 border rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Send WhatsApp Status Notification to Customer</h4>
            <div className="flex flex-wrap items-center gap-2">
              {['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((st) => (
                <Button
                  key={st}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 uppercase font-bold"
                  onClick={() => openWhatsAppStatusNotif(st)}
                >
                  <Send className="w-3 h-3 text-green-600" /> Send {st}
                </Button>
              ))}
            </div>
          </div>

          {/* Customer & Delivery Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-4 bg-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Customer Details</h3>
              <p className="font-bold text-base">{order.customer_name || 'Guest'}</p>
              <p className="text-sm text-muted-foreground mt-1">Phone: {order.customer_phone}</p>
            </div>

            <div className="border rounded-xl p-4 bg-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Delivery Address</h3>
              <p className="text-sm font-medium">
                {order.address_line_1}{order.address_line_2 ? `, ${order.address_line_2}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">{order.city}, {order.state} - {order.pincode}</p>
              {order.notes && <p className="text-xs text-muted-foreground mt-2 italic">Notes: {order.notes}</p>}
            </div>
          </div>

          {/* Order Items Table */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Order Items Snapshot</h3>
            <div className="border rounded-xl overflow-hidden text-sm">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b text-xs uppercase">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item: any) => {
                    const title = item.product?.name || item.product_name || 'Product Item';
                    const unitPrice = Number(item.price || item.unit_price || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = unitPrice * qty;

                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-3 font-semibold">{title}</td>
                        <td className="p-3 text-center">{qty}</td>
                        <td className="p-3 text-right">₹{unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="border-t pt-4 text-sm space-y-1.5 max-w-xs ml-auto text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount Savings</span>
                <span>-₹{(order.discount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{order.shipping === 0 ? 'FREE' : '₹' + (order.shipping || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold pt-2 border-t text-foreground">
              <span>Grand Total</span>
              <span>₹{databaseGrandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Confirmation Dialog for Payment Received */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <h3 className="font-bold text-lg">Confirm Payment Received</h3>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              Confirm payment of <strong className="text-emerald-700 dark:text-emerald-400">₹{databaseGrandTotal.toFixed(2)}</strong> received for Order <strong className="font-mono">#{orderNum}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowConfirmModal(false); setPendingPaymentStatus(null); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={confirmPaidStatus}
              >
                Confirm Payment Received
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
