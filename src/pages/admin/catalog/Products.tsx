import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Copy, Save, ChevronLeft, ChevronRight, Download, Upload, PackageOpen, Zap, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { productService, Product } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { downloadCSV, parseCSV } from '@/utils/csvExportImport';

export function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importParsedData, setImportParsedData] = useState<Record<string, string>[]>([]);

  // Inline Quick Edit State
  const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
  const [quickFormData, setQuickFormData] = useState<{ mrp: number; selling_price: number; stock: number }>({
    mrp: 0,
    selling_price: 0,
    stock: 0
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin_products'],
    queryFn: () => productService.getProducts()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin_categories'],
    queryFn: categoryService.getCategories
  });

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success('Product deleted successfully');
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`)
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productService.duplicateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success('Product duplicated successfully');
    },
    onError: (e: any) => toast.error(`Failed to duplicate: ${e.message}`)
  });

  const quickUpdateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      return await productService.updateProduct(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success('Prices and stock updated!');
      setQuickEditingId(null);
    },
    onError: (e: any) => toast.error(`Quick update failed: ${e.message}`)
  });

  // Bulk Mutations
  const executeBulkAction = async (actionType: 'delete' | 'feature' | 'unfeature' | 'trending' | 'archive' | 'restore') => {
    if (selectedIds.length === 0) return;
    if (actionType === 'delete' && !confirm(`Delete ${selectedIds.length} selected products?`)) return;

    try {
      for (const id of selectedIds) {
        if (actionType === 'delete') {
          await productService.deleteProduct(id);
        } else if (actionType === 'feature') {
          await productService.updateProduct(id, { is_featured: true });
        } else if (actionType === 'unfeature') {
          await productService.updateProduct(id, { is_featured: false });
        } else if (actionType === 'trending') {
          await productService.updateProduct(id, { is_trending: true });
        } else if (actionType === 'archive') {
          await productService.updateProduct(id, { status: 'draft' });
        } else if (actionType === 'restore') {
          await productService.updateProduct(id, { status: 'active' });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success(`Bulk action completed on ${selectedIds.length} products!`);
      setSelectedIds([]);
    } catch (e: any) {
      toast.error(`Bulk action failed: ${e.message}`);
    }
  };

  // CSV Export & Import Handlers
  const exportProductsToCSV = () => {
    const exportData = processedProducts.map(p => ({
      ID: p.id,
      Name: p.name,
      Slug: p.slug,
      MRP: p.mrp || p.selling_price,
      SellingPrice: p.selling_price,
      Stock: p.stock,
      Status: p.status || 'active',
      Category: p.category?.name || '',
      IsFeatured: p.is_featured ? 'true' : 'false',
      IsTrending: p.is_trending ? 'true' : 'false',
      Thumbnail: p.thumbnail || '',
      Description: p.description || ''
    }));

    downloadCSV(`products_export_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${exportData.length} products to CSV!`);
  };

  const handleCSVImportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseCSV(file);
      setImportParsedData(parsed);
      setIsImportModalOpen(true);
      toast.info(`Parsed ${parsed.length} rows from CSV.`);
    } catch (err: any) {
      toast.error('Failed to parse CSV file: ' + err.message);
    }
  };

  const processImportConfirm = async () => {
    if (importParsedData.length === 0) return;

    let count = 0;
    try {
      for (const row of importParsedData) {
        const name = row.Name || row.name;
        if (!name) continue;

        const payload: Partial<Product> = {
          name,
          slug: row.Slug || row.slug,
          mrp: Number(row.MRP || row.mrp || row.SellingPrice || row.price || 0),
          selling_price: Number(row.SellingPrice || row.price || row.selling_price || 0),
          stock: Number(row.Stock || row.stock || 0),
          status: (row.Status || row.status || 'active').toLowerCase(),
          is_featured: (row.IsFeatured || row.is_featured) === 'true',
          is_trending: (row.IsTrending || row.is_trending) === 'true',
          thumbnail: row.Thumbnail || row.thumbnail || '',
          description: row.Description || row.description || ''
        };

        await productService.createProduct(payload);
        count++;
      }
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success(`Imported ${count} products successfully!`);
      setIsImportModalOpen(false);
      setImportParsedData([]);
    } catch (e: any) {
      toast.error('Import failed: ' + e.message);
    }
  };

  const startQuickEdit = (p: Product) => {
    setQuickEditingId(p.id);
    setQuickFormData({
      mrp: p.mrp || p.selling_price,
      selling_price: p.selling_price,
      stock: p.stock || 0
    });
  };

  const saveQuickEdit = (id: string) => {
    quickUpdateMutation.mutate({
      id,
      updates: {
        mrp: Number(quickFormData.mrp),
        selling_price: Number(quickFormData.selling_price),
        stock: Number(quickFormData.stock)
      }
    });
  };

  // Filter & Sorting Logic
  const processedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.slug && p.slug.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'instock') matchesStock = (p.stock || 0) > 5;
      if (stockFilter === 'lowstock') matchesStock = (p.stock || 0) > 0 && (p.stock || 0) <= 5;
      if (stockFilter === 'outofstock') matchesStock = (p.stock || 0) <= 0;

      return matchesSearch && matchesStatus && matchesCategory && matchesStock;
    });

    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'price_high') return b.selling_price - a.selling_price;
      if (sortBy === 'price_low') return a.selling_price - b.selling_price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [products, searchTerm, statusFilter, categoryFilter, stockFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(start, start + itemsPerPage);
  }, [processedProducts, currentPage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products Catalog ({products.length})</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Manage catalog, bulk actions, CSV import/export, and inline price edits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={exportProductsToCSV} className="flex-1 sm:flex-initial text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
          <input type="file" id="csv-import-file" accept=".csv" className="hidden" onChange={handleCSVImportUpload} />
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-initial text-xs">
            <label htmlFor="csv-import-file" className="cursor-pointer">
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Import CSV
            </label>
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/products/new')} className="w-full sm:w-auto text-xs shadow-md">
            <Plus className="mr-1.5 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-sm border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Stock Filter */}
            <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="instock">In Stock (&gt;5)</SelectItem>
                <SelectItem value="lowstock">Low Stock (1-5)</SelectItem>
                <SelectItem value="outofstock">Out of Stock (0)</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <span>{selectedIds.length} product(s) selected</span>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => executeBulkAction('feature')}>Mark Featured</Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => executeBulkAction('trending')}>Mark Trending</Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => executeBulkAction('archive')}>Archive (Draft)</Button>
            <Button size="sm" variant="destructive" className="h-7 text-[11px]" onClick={() => executeBulkAction('delete')}>Delete Selected</Button>
          </div>
        </div>
      )}

      {/* Products Display (Responsive Table for Desktop & Compact Card View for Mobile) */}
      <Card className="shadow-sm overflow-hidden border-border/80">
        {/* Mobile Product Card View (< 768px) */}
        <div className="block md:hidden divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">Loading products...</div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <PackageOpen className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold">No products found</p>
            </div>
          ) : (
            paginatedProducts.map(product => {
              const isEditingThis = quickEditingId === product.id;
              const isSelected = selectedIds.includes(product.id);
              const itemMRP = isEditingThis ? quickFormData.mrp : (product.mrp || product.selling_price);
              const itemSelling = isEditingThis ? quickFormData.selling_price : product.selling_price;
              
              return (
                <div key={product.id} className="p-4 space-y-3 bg-card">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleSelectOne(product.id)}
                      className="rounded border-gray-300"
                    />
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border shrink-0">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.category?.name || 'Uncategorized'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  {/* Inline Quick Edit Panel for Mobile */}
                  {isEditingThis ? (
                    <div className="p-3 bg-secondary/50 rounded-xl space-y-3 border">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">MRP (₹)</label>
                          <Input
                            type="number"
                            className="h-8 text-xs font-bold"
                            value={quickFormData.mrp}
                            onChange={(e) => setQuickFormData({ ...quickFormData, mrp: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Price (₹)</label>
                          <Input
                            type="number"
                            className="h-8 text-xs font-bold"
                            value={quickFormData.selling_price}
                            onChange={(e) => setQuickFormData({ ...quickFormData, selling_price: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">Stock</label>
                          <Input
                            type="number"
                            className="h-8 text-xs font-bold"
                            value={quickFormData.stock}
                            onChange={(e) => setQuickFormData({ ...quickFormData, stock: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setQuickEditingId(null)}>Cancel</Button>
                        <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => saveQuickEdit(product.id)}>
                          <Save className="w-3.5 h-3.5 mr-1" /> Save Prices
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                      <div>
                        <span className="font-bold text-foreground text-sm">₹{itemSelling.toFixed(2)}</span>
                        {itemMRP > itemSelling && (
                          <span className="text-muted-foreground line-through ml-2 text-xs">₹{itemMRP.toFixed(2)}</span>
                        )}
                        <span className="ml-2 text-muted-foreground">({product.stock || 0} left)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="secondary" size="sm" className="h-8 text-[11px] font-bold gap-1 px-2.5" onClick={() => startQuickEdit(product)}>
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Quick Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/products/${product.id}`)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(product.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="p-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === paginatedProducts.length} 
                    onChange={toggleSelectAll} 
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">MRP (₹)</th>
                <th className="p-4 font-semibold">Selling Price (₹)</th>
                <th className="p-4 font-semibold">Discount</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">Loading products...</td></tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <PackageOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-bold">No products found</h3>
                      <p className="text-xs text-muted-foreground">Try adjusting search query or filters.</p>
                      <Button onClick={() => navigate('/admin/products/new')} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isEditingThis = quickEditingId === product.id;
                  const isSelected = selectedIds.includes(product.id);
                  const itemMRP = isEditingThis ? quickFormData.mrp : (product.mrp || product.selling_price);
                  const itemSelling = isEditingThis ? quickFormData.selling_price : product.selling_price;
                  const discountPercent = itemMRP > itemSelling && itemMRP > 0
                    ? Math.round(((itemMRP - itemSelling) / itemMRP) * 100)
                    : 0;

                  return (
                    <tr key={product.id} className={`border-b last:border-0 hover:bg-secondary/20 transition-colors ${isSelected ? 'bg-secondary/30' : ''}`}>
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelectOne(product.id)} 
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border shrink-0">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground truncate max-w-[200px]" title={product.name}>{product.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.is_featured && <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">Featured</span>}
                            {product.is_trending && <span className="text-[9px] font-bold bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">Trending</span>}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-xs font-semibold text-muted-foreground">
                        {product.category?.name || 'Uncategorized'}
                      </td>

                      <td className="p-4">
                        {isEditingThis ? (
                          <Input
                            type="number"
                            className="w-24 h-8 text-xs font-bold"
                            value={quickFormData.mrp}
                            onChange={(e) => setQuickFormData({ ...quickFormData, mrp: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="font-semibold text-muted-foreground line-through">₹{itemMRP.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEditingThis ? (
                          <Input
                            type="number"
                            className="w-24 h-8 text-xs font-bold"
                            value={quickFormData.selling_price}
                            onChange={(e) => setQuickFormData({ ...quickFormData, selling_price: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="font-bold text-foreground">₹{itemSelling.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {discountPercent > 0 ? (
                          <span className="text-xs font-bold bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            {discountPercent}% OFF
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEditingThis ? (
                          <Input
                            type="number"
                            className="w-20 h-8 text-xs font-bold"
                            value={quickFormData.stock}
                            onChange={(e) => setQuickFormData({ ...quickFormData, stock: Number(e.target.value) })}
                          />
                        ) : (
                          <span className={`font-bold ${product.stock > 0 ? 'text-foreground' : 'text-red-500'}`}>
                            {product.stock || 0} units
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {product.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditingThis ? (
                            <Button size="sm" className="h-8 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => saveQuickEdit(product.id)}>
                              <Save className="w-3.5 h-3.5 mr-1" /> Save
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="h-8 text-xs px-2.5 font-bold gap-1" onClick={() => startQuickEdit(product)}>
                              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Quick Edit
                            </Button>
                          )}

                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/products/${product.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-xs"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* CSV Import Preview Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirm CSV Product Import</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Review parsed products before importing to database. ({importParsedData.length} total rows)
          </p>

          <div className="flex-1 overflow-y-auto border rounded-xl p-4 bg-secondary/10">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b font-bold text-muted-foreground">
                  <th className="p-2">Name</th>
                  <th className="p-2">MRP</th>
                  <th className="p-2">Selling Price</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {importParsedData.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-2 font-bold truncate max-w-[150px]">{row.Name || row.name || 'Untitled'}</td>
                    <td className="p-2">₹{row.MRP || row.mrp || row.SellingPrice || 0}</td>
                    <td className="p-2 font-bold">₹{row.SellingPrice || row.price || 0}</td>
                    <td className="p-2">{row.Stock || row.stock || 0}</td>
                    <td className="p-2 uppercase">{row.Status || row.status || 'active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button onClick={processImportConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Confirm & Import {importParsedData.length} Products
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
