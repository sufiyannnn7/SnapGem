import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, User, ShoppingBag, MapPin, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { downloadCSV } from '@/utils/csvExportImport';

interface CustomerSummary {
  phone: string;
  name: string;
  address: string;
  orderCount: number;
  lifetimeSpending: number;
  lastOrderDate: string;
}

export function Customers() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin_orders_customers'],
    queryFn: orderService.getAdminOrders
  });

  const customerList: CustomerSummary[] = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    orders.forEach((o: any) => {
      const phone = (o.customer_phone || '').trim();
      if (!phone) return;

      const fullAddress = `${o.address_line_1 || ''}${o.address_line_2 ? ', ' + o.address_line_2 : ''}, ${o.city || ''}, ${o.state || ''} - ${o.pincode || ''}`;
      const total = o.total || 0;
      const orderDate = o.created_at;

      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: o.customer_name || 'Guest Customer',
          address: fullAddress,
          orderCount: 1,
          lifetimeSpending: total,
          lastOrderDate: orderDate
        });
      } else {
        const existing = map.get(phone)!;
        existing.orderCount += 1;
        existing.lifetimeSpending += total;
        if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = orderDate;
          existing.name = o.customer_name || existing.name;
          existing.address = fullAddress;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.lifetimeSpending - a.lifetimeSpending);
  }, [orders]);

  const filteredCustomers = customerList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCustomersCSV = () => {
    const exportData = filteredCustomers.map(c => ({
      CustomerName: c.name,
      Phone: c.phone,
      Address: c.address,
      TotalOrders: c.orderCount,
      LifetimeSpending: c.lifetimeSpending,
      LastOrderDate: format(new Date(c.lastOrderDate), 'yyyy-MM-dd HH:mm')
    }));
    downloadCSV(`customers_database_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Database</h2>
          <p className="text-muted-foreground text-sm mt-1">Sourced automatically from WhatsApp storefront order submissions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCustomersCSV}>
          <Download className="w-4 h-4 mr-2" /> Export Customers CSV
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name or phone..."
                className="pl-8 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Unique Customers: <span className="font-bold text-foreground">{customerList.length}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Phone Number</th>
                  <th className="p-4 font-semibold">Delivery Address</th>
                  <th className="p-4 font-semibold text-center">Orders</th>
                  <th className="p-4 font-semibold">Lifetime Spending</th>
                  <th className="p-4 font-semibold">Last Order Date</th>
                  <th className="p-4 font-semibold text-right">Quick Chat</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Loading customer records...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No customer records found.</td></tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                    const waChatUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${cust.name}, checking in from SnapGem Store...`)}`;

                    return (
                      <tr key={cust.phone} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-bold text-foreground flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border">
                            {cust.name.charAt(0)}
                          </div>
                          <span>{cust.name}</span>
                        </td>
                        <td className="p-4 text-xs font-mono text-muted-foreground">{cust.phone}</td>
                        <td className="p-4 text-xs text-muted-foreground max-w-xs truncate" title={cust.address}>
                          {cust.address}
                        </td>
                        <td className="p-4 text-center font-bold text-sm">{cust.orderCount}</td>
                        <td className="p-4 font-bold text-foreground">₹{cust.lifetimeSpending.toFixed(2)}</td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {format(new Date(cust.lastOrderDate), 'dd MMM yyyy')}
                        </td>
                        <td className="p-4 text-right">
                          <a
                            href={waChatUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
