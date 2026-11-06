import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { expenseService, Expense } from '@/services/expenseService';
import { format } from 'date-fns';

export function Expenses() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Packaging');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['admin_expenses'],
    queryFn: expenseService.getExpenses
  });

  const createMutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_expenses'] });
      toast.success('Expense recorded successfully!');
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setNotes('');
    },
    onError: (e: any) => toast.error(`Failed to add expense: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_expenses'] });
      toast.success('Expense deleted');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || Number(amount) <= 0) {
      toast.error('Please enter valid title and amount');
      return;
    }
    createMutation.mutate({
      title,
      amount: Number(amount),
      category,
      date,
      notes
    });
  };

  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Manager</h2>
          <p className="text-muted-foreground text-sm mt-1">Track store overheads, packaging, courier charges, salaries, and marketing expenses.</p>
        </div>
        <Button size="lg" onClick={() => setIsModalOpen(true)} className="shadow-md">
          <Plus className="mr-2 h-5 w-5" /> Add New Expense
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-l-4 border-l-red-600 shadow-sm max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Business Overheads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">₹{totalExpenseAmount.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Across all logged categories</p>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Logged Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Amount (₹)</th>
                  <th className="p-4 font-semibold">Notes</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Loading expenses...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No expenses logged yet. Click "Add New Expense" above.</td></tr>
                ) : (
                  expenses.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{item.title}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary border">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">{item.date}</td>
                      <td className="p-4 font-bold text-red-600">₹{item.amount.toFixed(2)}</td>
                      <td className="p-4 text-xs text-muted-foreground">{item.notes || '-'}</td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (confirm('Delete expense log?')) deleteMutation.mutate(item.id);
                          }}
                        >
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

      {/* Add Expense Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Business Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Expense Title *</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Courier Shipping Boxes" 
                required 
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Amount (₹) *</label>
              <Input 
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="1500" 
                required 
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 border rounded-lg px-3 text-sm bg-background font-semibold"
              >
                <option value="Packaging">Packaging</option>
                <option value="Courier">Courier & Shipping</option>
                <option value="Advertising">Advertising & Marketing</option>
                <option value="Electricity">Electricity & Utilities</option>
                <option value="Internet">Internet & Software</option>
                <option value="Salary">Salary & Staff</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Date *</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Notes (Optional)</label>
              <Input 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Details..." 
                className="h-11"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                {createMutation.isPending ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
