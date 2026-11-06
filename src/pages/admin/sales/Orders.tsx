import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, formatOrderNumber } from '@/services/orderService';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Printer, Download, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { downloadCSV } from '@/utils/csvExportImport';

export function Orders() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin_orders'],
    queryFn: orderService.getAdminOrders
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates, currentOrder }: { id: string; updates: any; currentOrder?: any }) => {
      return orderService.updateOrder(id, updates, currentOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin_dashboard_stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success('Order status updated');
    },
    onError: (e: any) => toast.error(`Failed to update order: ${e.message}`)
  });

  const exportOrdersCSV = () => {
    const exportData = filteredOrders.map(o => ({
      OrderNumber: o.order_number || o.id.slice(0, 8),
      CustomerName: o.customer_name || 'Guest',
      Phone: o.customer_phone || '',
      Address: `${o.address_line_1 || ''} ${o.city || ''} ${o.state || ''} ${o.pincode || ''}`,
      Subtotal: o.subtotal || 0,
      Shipping: o.shipping || 0,
      GrandTotal: o.total || 0,
      PaymentStatus: o.payment_status || 'pending',
      OrderStatus: o.status || 'pending',
      Date: format(new Date(o.created_at), 'yyyy-MM-dd HH:mm')
    }));
    downloadCSV(`orders_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success('Orders exported to CSV!');
  };

  const printInvoice = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0;">${item.product?.name || 'Product'}</td>
        <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold;">₹${((item.price || 0) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.order_number || order.id.slice(0, 8)}</title>
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
              <div class="title">Official Store Invoice</div>
              <p style="color: #666; font-size: 12px; margin-top: 5px;">Order #${order.order_number || order.id.slice(0, 8)}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: bold;">Date: ${format(new Date(order.created_at), 'dd MMM yyyy')}</p>
              <p style="color: #666; font-size: 12px; margin-top: 5px;">Payment: ${order.payment_status?.toUpperCase()}</p>
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
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-row">
            Grand Total: ₹${(order.total || 0).toFixed(2)}
          </div>

          <div style="margin-top: 50px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you for shopping with us!
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  const filteredOrders = orders.filter(o => {
    // 1. Filter by Status
    let matchesStatus = true;
    if (filterStatus === 'paid') matchesStatus = o.payment_status === 'paid';
    else if (filterStatus === 'pending_payment') matchesStatus = o.payment_status === 'pending';
    else if (filterStatus !== 'all') matchesStatus = o.status === filterStatus;

    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;

    // 2. Search Query Filter
    const q = searchQuery.toLowerCase().trim();
    const formattedNum = formatOrderNumber(o).toLowerCase();
    const orderNum = (o.order_number || o.id || '').toLowerCase();
    const custName = (o.customer_name || '').toLowerCase();
    const custPhone = (o.customer_phone || '').toLowerCase();
    const city = (o.city || '').toLowerCase();
    const state = (o.state || '').toLowerCase();
    const pincode = (o.pincode || '').toLowerCase();
    const itemNames = (o.items || []).map((i: any) => i.product?.name?.toLowerCase() || '').join(' ');

    return (
      formattedNum.includes(q) ||
      orderNum.includes(q) ||
      custName.includes(q) ||
      custPhone.includes(q) ||
      city.includes(q) ||
      state.includes(q) ||
      pincode.includes(q) ||
      itemNames.includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-muted-foreground text-sm mt-1">Review orders, update fulfillment & payment statuses, print invoices, and export CSV.</p>
        </div>
      </div>

      {/* Search Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
        {/* Search Orders Input with Search Button */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Order #, Customer Name, Phone, City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-background border-border/80 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            size="sm"
            className="h-10 px-4 text-xs font-bold gap-1.5 rounded-xl shrink-0"
            onClick={() => {
              if (searchQuery.trim()) {
                toast.info(`Searching orders for: "${searchQuery}"`);
              }
            }}
          >
            <Search className="w-3.5 h-3.5" /> Search
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export CSV Button */}
          <Button variant="outline" size="sm" onClick={exportOrdersCSV} className="h-10 rounded-xl text-xs gap-1.5 font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </Button>

          {/* Filter Badges */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border flex-wrap">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  filterStatus === st ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Orders List ({filteredOrders.length})</CardTitle>
          <CardDescription className="text-xs">Click WhatsApp button to chat with customer directly.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              No orders found in this view.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => {
                const formattedNum = formatOrderNumber(order);
                const custPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
                const waChatUrl = `https://wa.me/${custPhone}?text=${encodeURIComponent(`Hi ${order.customer_name}, regarding your order ${formattedNum}...`)}`;

                return (
                  <div key={order.id} className="border rounded-2xl p-5 bg-card hover:border-foreground/20 transition-all space-y-4 shadow-sm">
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-base">{formattedNum}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp Button */}
                        <a
                          href={waChatUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Customer
                        </a>

                        {/* Print Invoice Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs gap-1.5"
                          onClick={() => printInvoice(order)}
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Invoice
                        </Button>
                      </div>
                    </div>

                    {/* Middle Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Customer Info */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer & Address</p>
                        <p className="font-bold text-foreground">{order.customer_name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {order.address_line_1}{order.address_line_2 ? `, ${order.address_line_2}` : ''}, {order.city}, {order.state} - {order.pincode}
                        </p>
                      </div>

                      {/* Payment Status Switch */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payment Status</p>
                        <div className="flex items-center gap-2">
                          <select
                            className={`border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                              order.payment_status === 'paid' ? 'bg-green-500/10 text-green-700 border-green-500/30' : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                            }`}
                            value={order.payment_status || 'pending'}
                            onChange={(e) => updateOrderMutation.mutate({ id: order.id, updates: { payment_status: e.target.value }, currentOrder: order })}
                          >
                            <option value="pending">Pending Payment</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                      </div>

                      {/* Order Status Actions */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fulfillment Status</p>
                        <select
                          className="w-full border rounded-lg px-3 py-1.5 text-xs font-semibold bg-background focus:outline-none cursor-pointer"
                          value={order.status || 'pending'}
                          onChange={(e) => updateOrderMutation.mutate({ id: order.id, updates: { status: e.target.value }, currentOrder: order })}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed (Reduces Stock)</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Status Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                      <span className="font-semibold text-muted-foreground mr-1">Quick Mark:</span>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => updateOrderMutation.mutate({ id: order.id, updates: { status: 'confirmed' }, currentOrder: order })}>
                        Mark Confirmed
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => updateOrderMutation.mutate({ id: order.id, updates: { payment_status: 'paid' }, currentOrder: order })}>
                        Mark Paid
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => updateOrderMutation.mutate({ id: order.id, updates: { status: 'packed' }, currentOrder: order })}>
                        Mark Packed
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => updateOrderMutation.mutate({ id: order.id, updates: { status: 'shipped' }, currentOrder: order })}>
                        Mark Shipped
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => updateOrderMutation.mutate({ id: order.id, updates: { status: 'delivered' }, currentOrder: order })}>
                        Mark Delivered
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 text-red-600 hover:text-red-700" onClick={() => updateOrderMutation.mutate({ id: order.id, updates: { status: 'cancelled' }, currentOrder: order })}>
                        Mark Cancelled
                      </Button>
                    </div>

                    {/* Bottom Line Items & Total */}
                    <div className="bg-secondary/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-muted-foreground">Items:</span>
                        {(order.items || []).map((item: any, idx: number) => (
                          <span key={idx} className="bg-background border px-2 py-0.5 rounded-md font-medium">
                            {item.product?.name || 'Item'} (x{item.quantity})
                          </span>
                        ))}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-muted-foreground mr-2">Grand Total:</span>
                        <span className="font-bold text-sm text-foreground">₹{(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
