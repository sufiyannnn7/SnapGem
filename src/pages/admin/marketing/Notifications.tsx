import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Bell, Send } from 'lucide-react';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/lib/supabase'; // We'll query users directly for admin dropdown

export function Notifications() {
  const queryClient = useQueryClient();

  // We need to fetch users to send notifications to
  const { data: users = [] } = useQuery({
    queryKey: ['admin_users_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email');
      if (error) throw error;
      return data;
    }
  });

  const form = useForm({
    defaultValues: {
      user_id: '',
      title: '',
      message: '',
      link_url: ''
    }
  });

  const sendMutation = useMutation({
    mutationFn: notificationService.createNotification,
    onSuccess: () => {
      toast.success('Notification sent!');
      form.reset();
      // If we were displaying a list of all sent notifications, we'd invalidate here
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const onSubmit = (data: any) => {
    if (data.user_id === 'ALL') {
       toast.error("Sending to all users requires an edge function or batch script in a real app.");
       return;
    }
    sendMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Send Notification</h2>
          <p className="text-muted-foreground mt-2">Push messages directly to specific customers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> New Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a user...</option>
                        <option value="ALL">All Users (Disabled in demo)</option>
                        {users.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name || u.email || u.id}</option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Order Shipped!" required /></FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl><Textarea {...field} placeholder="e.g. Your package is on the way." required /></FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (Optional)</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. /profile/orders" /></FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={sendMutation.isPending || !form.watch('user_id')}>
                  <Send className="mr-2 h-4 w-4" /> Send Notification
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
