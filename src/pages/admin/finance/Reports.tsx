import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { expenseService } from '@/services/expenseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ShoppingBag, TrendingUp, TrendingDown, Calendar, Package } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

export function Reports() {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin_reports_orders'],
    queryFn: orderService.getAdminOrders
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['admin_reports_expenses'],
    queryFn: expenseService.getExpenses
  });

  const reportMetrics = useMemo(() => {
    const filterFn = (dateStr: string) => {
      const d = new Date(dateStr);
      if (timeFilter === 'today') return isToday(d);
      if (timeFilter === 'week') return isThisWeek(d);
      if (timeFilter === 'month') return isThisMonth(d);
      if (timeFilter === 'year') return isThisYear(d);
      return true;
    };

    const filteredOrders = orders.filter(o => filterFn(o.created_at));
    const filteredExpenses = expenses.filter(e => filterFn(e.date));

    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (o.total || 0), 0);

    const totalExpensesAmount = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    let productsSoldCount = 0;
    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();

    filteredOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((item: any) => {
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const name = item.product?.name || 'Jewelry Product';
        productsSoldCount += qty;

        if (!productSalesMap.has(name)) {
          productSalesMap.set(name, { name, qty, revenue: price * qty });
        } else {
          const prev = productSalesMap.get(name)!;
          prev.qty += qty;
          prev.revenue += (price * qty);
        }
      });
    });

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const netProfit = totalRevenue - totalExpensesAmount;

    return {
      totalOrdersCount,
      totalRevenue,
      totalExpensesAmount,
      netProfit,
      productsSoldCount,
      topSellingProducts
    };
  }, [orders, expenses, timeFilter]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Financial Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time revenue, expense overheads, and net profit calculations.</p>
        </div>

        {/* Time Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border">
          {(['today', 'week', 'month', 'year'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                timeFilter === tf ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf === 'today' ? 'Today' : tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Orders */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportMetrics.totalOrdersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{reportMetrics.productsSoldCount} total items sold</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{reportMetrics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross confirmed sales</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₹{reportMetrics.totalExpensesAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Operational overheads</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={`border-l-4 shadow-sm ${reportMetrics.netProfit >= 0 ? 'border-l-emerald-600' : 'border-l-red-600'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${reportMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{reportMetrics.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Revenue minus Expenses</p>
          </CardContent>
        </Card>

      </div>

      {/* Top Selling Products List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Top Selling Products ({timeFilter.toUpperCase()})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Product Name</th>
                  <th className="p-4 font-semibold text-center">Units Sold</th>
                  <th className="p-4 font-semibold text-right">Revenue Generated (₹)</th>
                </tr>
              </thead>
              <tbody>
                {reportMetrics.topSellingProducts.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No items sold during this time period.</td></tr>
                ) : (
                  reportMetrics.topSellingProducts.map((p, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{p.name}</td>
                      <td className="p-4 text-center font-bold text-sm">{p.qty}</td>
                      <td className="p-4 text-right font-bold text-foreground">₹{p.revenue.toFixed(2)}</td>
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
