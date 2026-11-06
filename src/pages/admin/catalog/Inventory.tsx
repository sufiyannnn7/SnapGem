import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Save, AlertCircle, CheckCircle2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { productService, Product } from '@/services/productService';

export function Inventory() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ stock: number; mrp: number; selling_price: number }>({ stock: 0, mrp: 0, selling_price: 0 });

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['admin_inventory_products'],
    queryFn: () => productService.getProducts()
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      return await productService.updateProduct(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_inventory_products'] });
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      queryClient.invalidateQueries({ queryKey: ['admin_dashboard_stats'] });
      toast.success('Inventory updated successfully!');
      setEditingStockId(null);
    },
    onError: (e: any) => toast.error(`Update failed: ${e.message}`)
  });

  const startEdit = (p: Product) => {
    setEditingStockId(p.id);
    setEditingData({
      stock: p.stock || 0,
      mrp: p.mrp || p.selling_price,
      selling_price: p.selling_price
    });
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({
      id,
      updates: {
        stock: Number(editingData.stock),
        mrp: Number(editingData.mrp),
        selling_price: Number(editingData.selling_price)
      }
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.slug && p.slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time stock control, SKU tracking, and quick price adjustments.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Stock
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory by product name..."
                className="pl-8 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              Total Items: <span className="font-bold text-foreground">{products.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Thumbnail</th>
                  <th className="p-4 font-semibold">Product Name</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">MRP (₹)</th>
                  <th className="p-4 font-semibold">Selling Price (₹)</th>
                  <th className="p-4 font-semibold">Current Stock</th>
                  <th className="p-4 font-semibold">Stock Status</th>
                  <th className="p-4 font-semibold text-right">Inline Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">Loading inventory...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No products found in inventory.</td></tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isEditing = editingStockId === product.id;
                    const stock = isEditing ? editingData.stock : (product.stock || 0);
                    const isLowStock = stock <= 5;
                    const isOutOfStock = stock <= 0;

                    return (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="p-3">
                          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-foreground truncate max-w-[200px]" title={product.name}>{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">/{product.slug}</p>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground font-medium">
                          {product.category?.name || 'Uncategorized'}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs font-bold"
                              value={editingData.mrp}
                              onChange={(e) => setEditingData({ ...editingData, mrp: Number(e.target.value) })}
                            />
                          ) : (
                            <span className="text-muted-foreground line-through text-xs font-semibold">₹{(product.mrp || product.selling_price).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs font-bold"
                              value={editingData.selling_price}
                              onChange={(e) => setEditingData({ ...editingData, selling_price: Number(e.target.value) })}
                            />
                          ) : (
                            <span className="font-bold text-foreground">₹{product.selling_price.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-20 h-8 text-xs font-bold"
                              value={editingData.stock}
                              onChange={(e) => setEditingData({ ...editingData, stock: Number(e.target.value) })}
                            />
                          ) : (
                            <span className={`font-bold text-sm ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-foreground'}`}>
                              {product.stock || 0} units
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" /> Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" /> Low Stock ({stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => saveEdit(product.id)}>
                              <Save className="w-3.5 h-3.5 mr-1" /> Save
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => startEdit(product)}>
                              Edit Stock
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
