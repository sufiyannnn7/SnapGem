import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, MapPin, ShoppingBag } from 'lucide-react';

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['admin_customer', id],
    queryFn: async () => {
      // 1. Get user profile/auth data (In Supabase, we ideally query a profiles table.
      // Since we don't have one exposed, we'll fetch orders and infer)
      // Actually, we can fetch all their orders and addresses
      const [
        { data: addresses },
        { data: orders }
      ] = await Promise.all([
        supabase.from('addresses').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false })
      ]);

      return {
        id,
        addresses: addresses || [],
        orders: orders || [],
        totalSpent: orders?.reduce((acc, order) => acc + order.total, 0) || 0,
        // Mock name if none in addresses
        name: addresses?.[0]?.full_name || 'Customer',
        phone: addresses?.[0]?.phone || 'N/A'
      };
    }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!customer) return <div className="p-8">Customer not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-muted-foreground">ID: {customer.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.orders.length === 0 ? (
                <p className="text-muted-foreground">No orders found for this customer.</p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 border-b">
                      <tr>
                        <th className="p-4 font-medium">Order ID</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((order: any) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-secondary/20 cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                          <td className="p-4 font-medium">#{order.id.split('-')[0]}</td>
                          <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">${order.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${customer.totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-lg font-medium">{customer.orders.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-base">{customer.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.addresses.length === 0 ? (
                 <p className="text-muted-foreground text-sm">No saved addresses.</p>
              ) : (
                <div className="space-y-4">
                  {customer.addresses.map((address: any) => (
                    <div key={address.id} className="text-sm border-b pb-4 last:border-0 last:pb-0">
                      {address.is_default && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full inline-block mb-2">Default</span>}
                      <p className="font-medium">{address.full_name}</p>
                      <p>{address.address_line_1}</p>
                      {address.address_line_2 && <p>{address.address_line_2}</p>}
                      <p>{address.city}, {address.state} {address.postal_code}</p>
                      <p>{address.country}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
