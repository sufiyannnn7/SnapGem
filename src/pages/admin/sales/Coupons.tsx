import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { couponService, Coupon } from '@/services/couponService';

export function Coupons() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<Partial<Coupon>>({
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_amount: 0,
      min_purchase: 0,
      max_discount: null,
      usage_limit: null,
      is_active: true,
    }
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin_coupons'],
    queryFn: couponService.getCoupons
  });

  const createMutation = useMutation({
    mutationFn: couponService.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_coupons'] });
      toast.success('Coupon created');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Coupon> }) => 
      couponService.updateCoupon(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_coupons'] });
      toast.success('Coupon updated');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: couponService.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_coupons'] });
      toast.success('Coupon deleted');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const onSubmit = (data: Partial<Coupon>) => {
    // Basic formatting
    if (data.code) data.code = data.code.toUpperCase();
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  const handleEdit = (c: Coupon) => {
    setEditingId(c.id);
    form.reset(c);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    form.reset({
      code: '', discount_type: 'percentage', discount_amount: 0, min_purchase: 0, max_discount: null, usage_limit: null, is_active: true,
    });
    setIsModalOpen(true);
  };

  const filteredCoupons = coupons.filter(c => c.code.includes(searchTerm.toUpperCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground mt-2">Create and manage discount codes.</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b">
                <tr>
                  <th className="p-4 font-medium">Code</th>
                  <th className="p-4 font-medium">Discount</th>
                  <th className="p-4 font-medium">Usage</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">No coupons found.</td></tr>
                ) : (
                  filteredCoupons.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/20">
                      <td className="p-4 font-bold text-primary flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" /> {c.code}
                      </td>
                      <td className="p-4">
                        {c.discount_type === 'percentage' ? `${c.discount_amount}%` : `$${c.discount_amount}`}
                        {c.min_purchase ? <span className="text-xs text-muted-foreground block">Min. ${c.min_purchase}</span> : ''}
                      </td>
                      <td className="p-4">
                        {c.times_used} {c.usage_limit ? `/ ${c.usage_limit}` : 'uses'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'}`}>
                          {c.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => {
                          if(confirm('Are you sure?')) deleteMutation.mutate(c.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. SUMMER20" className="uppercase" /></FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_purchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Purchase ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usage_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit (Uses)</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 pt-2">
                    <FormControl><Switch checked={field.value || false} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Active</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  Save Coupon
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
