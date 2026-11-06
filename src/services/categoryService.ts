import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const categoryService = {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name');
      
    if (error) throw error;
    return data as Category[];
  },

  async getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .limit(1);
      
    if (error) throw error;
    return (data && data.length > 0 ? data[0] : null) as Category | null;
  },

  async createCategory(category: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
      
    if (error) throw error;
    return data as Category;
  },

  async updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Category;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};
