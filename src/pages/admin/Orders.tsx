import { useGetAdminOrders, useUpdateOrderStatus, getGetAdminOrdersQueryKey } from '@workspace/api-client-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice } from '@/lib/api';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminOrders() {
  const { data, isLoading } = useGetAdminOrders({ page: 1, limit: 50 } as any);
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: any) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminOrdersQueryKey() });
          toast({ title: 'Order status updated' });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">Manage and track customer orders.</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : data?.orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id.toString().padStart(6, '0')}</TableCell>
                <TableCell>{format(new Date(order.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>User {order.userId}</TableCell>
                <TableCell>{formatPrice(order.total)}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium uppercase ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.paymentStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(order.status) + " border-0 uppercase text-[10px]"}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={(val) => handleStatusChange(order.id, val)}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}