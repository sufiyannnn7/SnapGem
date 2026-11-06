import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { categoryService, Category } from '@/services/categoryService';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';

export function Categories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<Partial<Category>>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: null,
      display_order: 0,
      is_active: true,
      is_featured: false,
    }
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin_categories'],
    queryFn: categoryService.getCategories
  });

  const createMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
      toast.success('Category created successfully');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(`Failed to create category: ${e.message}`)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Category> }) => 
      categoryService.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
      toast.success('Category updated successfully');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(`Failed to update category: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (e: any) => toast.error(`Failed to delete category: ${e.message}`)
  });

  const onSubmit = (data: Partial<Category>) => {
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (data.parent_id === 'none') {
      data.parent_id = null;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    form.reset({
      ...cat,
      parent_id: cat.parent_id || 'none'
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    form.reset({
      name: '', slug: '', description: '', image_url: '', parent_id: 'none', display_order: 0, is_active: true, is_featured: false,
    });
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories ({categories.length})</h2>
          <p className="text-muted-foreground mt-2">Manage store categories, parent-child hierarchies, and images.</p>
        </div>
        <Button size="lg" onClick={handleAddNew} className="shadow-md">
          <Plus className="mr-2 h-5 w-5" /> Add Category
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Categories Cards View */}
          <div className="block md:hidden space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold">No categories found</p>
                <Button size="sm" onClick={handleAddNew} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" /> Create Category
                </Button>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border bg-card/60 shadow-xs flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border shrink-0">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-base truncate">{cat.name}</h4>
                        <p className="text-xs text-muted-foreground font-mono truncate">/{cat.slug}</p>
                        {cat.parent_id && categoryMap.has(cat.parent_id) && (
                          <span className="inline-block text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md mt-1">
                            Parent: {categoryMap.get(cat.parent_id)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cat.is_active ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {cat.is_active ? 'Active' : 'Draft'}
                      </span>
                      {cat.is_featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(cat)} className="flex-1 h-9">
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-9" 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this category?')) {
                          deleteMutation.mutate(cat.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Categories Table View */}
          <div className="hidden md:block rounded-xl border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Parent Category</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Featured</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Loading categories...</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-bold">No categories yet</h3>
                        <p className="text-xs text-muted-foreground">Organize your store by creating product categories.</p>
                        <Button onClick={handleAddNew} className="w-full">
                          <Plus className="mr-2 h-4 w-4" /> Create Category
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border shrink-0">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-muted-foreground">
                        {cat.parent_id && categoryMap.has(cat.parent_id) 
                          ? categoryMap.get(cat.parent_id) 
                          : <span className="italic text-muted-foreground/60">None (Root)</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          cat.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {cat.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-xs">
                        {cat.is_featured ? <span className="text-primary font-bold">Yes</span> : 'No'}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cat)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => {
                          if (confirm('Are you sure you want to delete this category?')) {
                            deleteMutation.mutate(cat.id);
                          }
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingId ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Fine Jewelry" className="h-11" /></FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Parent Category (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Top-Level Category)</SelectItem>
                        {categories
                          .filter(c => c.id !== editingId)
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Image</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="https://..." className="h-11" />
                      </FormControl>
                      <MediaPickerModal 
                        defaultBucket="categories"
                        onSelect={(url) => form.setValue('image_url', url)} 
                        trigger={<Button type="button" variant="outline" className="h-11">Select Image</Button>}
                      />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ''} placeholder="Category description..." /></FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-6 pt-2">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-semibold text-sm">Active Category</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-semibold text-sm">Featured</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
