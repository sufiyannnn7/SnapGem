import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface CustomerStat {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

async function getAdminCustomers() {
  const { data, error } = await supabase
    .from('orders')
    .select('customer_phone, customer_name, total, created_at')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  const customerMap = new Map<string, CustomerStat>();
  
  data.forEach(order => {
    const phone = order.customer_phone || 'Unknown';
    const name = order.customer_name || 'Guest';
    
    if (customerMap.has(phone)) {
      const existing = customerMap.get(phone)!;
      existing.totalOrders += 1;
      existing.totalSpent += order.total;
    } else {
      customerMap.set(phone, {
        phone,
        name,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderDate: order.created_at
      });
    }
  });

  return Array.from(customerMap.values());
}

export function Customers() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin_customers'],
    queryFn: getAdminCustomers
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground mt-2">Manage customer accounts and view details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers Directory</CardTitle>
          <CardDescription>A list of all unique customers who have placed orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.phone}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>{new Date(customer.lastOrderDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
