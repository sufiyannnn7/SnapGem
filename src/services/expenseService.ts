import { supabase } from '../lib/supabase';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  created_at?: string;
}

const LOCAL_EXPENSES_KEY = 'snapgem_expenses_fallback';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    let localExpenses: Expense[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_EXPENSES_KEY);
      if (raw) localExpenses = JSON.parse(raw);
    } catch {
      localExpenses = [];
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) {
        return localExpenses;
      }

      // Combine database expenses with local fallback items without duplicates
      const dbIds = new Set(data.map(d => String(d.id)));
      const uniqueLocal = localExpenses.filter(l => !dbIds.has(String(l.id)));
      return [...data, ...uniqueLocal] as Expense[];
    } catch {
      return localExpenses;
    }
  },

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    let newExpense: Expense;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error || !data) {
        newExpense = { id: 'exp-' + Date.now(), ...expense } as Expense;
      } else {
        newExpense = data as Expense;
      }
    } catch {
      newExpense = { id: 'exp-' + Date.now(), ...expense } as Expense;
    }

    // Always persist to local fallback cache so UI updates immediately even if table is missing
    try {
      const raw = localStorage.getItem(LOCAL_EXPENSES_KEY);
      const existing: Expense[] = raw ? JSON.parse(raw) : [];
      const updated = [newExpense, ...existing.filter(e => e.id !== newExpense.id)];
      localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    return newExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
    } catch {
      // Ignore Supabase errors for local items
    }

    try {
      const raw = localStorage.getItem(LOCAL_EXPENSES_KEY);
      if (raw) {
        const existing: Expense[] = JSON.parse(raw);
        const updated = existing.filter(e => String(e.id) !== String(id));
        localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('LocalStorage delete error:', e);
    }
  }
};
