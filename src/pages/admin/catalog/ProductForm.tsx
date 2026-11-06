import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, ArrowLeft, Image as ImageIcon, Percent, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { productService, Product } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { ImageDropzone } from '@/components/admin/ImageDropzone';

export function ProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['admin_categories'],
    queryFn: categoryService.getCategories
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin_product', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const products = await productService.getProducts();
      return products.find(p => p.id === id) || null;
    },
    enabled: isEditing
  });

  const form = useForm<Partial<Product> & { sku?: string; gallery: { url: string }[] }>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      thumbnail: '',
      mrp: 0,
      selling_price: 0,
      stock: 10,
      status: 'active',
      sku: '',
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: false,
      is_trending: false,
      category_id: null,
      seo_title: '',
      seo_description: '',
      gallery: []
    }
  });

  const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({
    control: form.control,
    name: "gallery"
  });

  useEffect(() => {
    if (product) {
       form.reset({
         ...product,
         gallery: product.images ? product.images.map(img => ({ url: img.image_url })) : []
       });
    }
  }, [product, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const productPayload = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: data.description,
        thumbnail: data.thumbnail,
        mrp: data.mrp ? Number(data.mrp) : null,
        selling_price: Number(data.selling_price || 0),
        stock: Number(data.stock || 0),
        status: data.status || 'active',
        is_featured: Boolean(data.is_featured),
        is_best_seller: Boolean(data.is_best_seller),
        is_new_arrival: Boolean(data.is_new_arrival),
        is_trending: Boolean(data.is_trending),
        category_id: data.category_id || null,
        seo_title: data.seo_title || null,
        seo_description: data.seo_description || null
      };

      let savedProduct;
      if (isEditing && id) {
         savedProduct = await productService.updateProduct(id, productPayload);
      } else {
         savedProduct = await productService.createProduct(productPayload);
      }

      if (data.gallery && data.gallery.length > 0) {
        const galleryPayload = data.gallery.map((g: any, idx: number) => ({
          image_url: g.url,
          display_order: idx
        }));
        await productService.updateProductImages(savedProduct.id, galleryPayload);
      }

      return savedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      navigate('/admin/products');
    },
    onError: (e: any) => toast.error(`Save failed: ${e.message}`)
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  // Live Auto Discount & You Save Calculation
  const mrp = Number(form.watch('mrp')) || 0;
  const sellingPrice = Number(form.watch('selling_price')) || 0;
  const savingsAmount = mrp > sellingPrice ? mrp - sellingPrice : 0;
  const discountPercent = mrp > sellingPrice && mrp > 0
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : 0;

  if (isEditing && isLoading) return <div className="p-12 text-center text-muted-foreground">Loading product data...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
          <p className="text-muted-foreground text-xs">Fill in basic details, pricing, inventory stock, and gallery images.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* SECTION 1: BASIC INFO */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">1. Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm">Product Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Royal Gold Necklace" className="h-11" required /></FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm">Description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ''} className="min-h-[100px]" placeholder="Enter product description..." /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SECTION 2: PRICING */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">2. Pricing</CardTitle>
              <CardDescription className="text-xs">Set MRP and Selling Price. Savings and Discount calculate automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-sm">MRP (Maximum Retail Price ₹) *</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} placeholder="1999" className="h-11" required /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-sm">Selling Price (₹) *</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} placeholder="1499" className="h-11" required /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Automatic Savings & Discount % Display */}
              <div className="p-4 rounded-xl border bg-secondary/30 flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Discount Badge</span>
                  <span className="font-bold text-green-700 dark:text-green-400 text-lg">{discountPercent}% OFF</span>
                </div>
                {savingsAmount > 0 && (
                  <div className="text-right">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Customer Savings</span>
                    <span className="font-bold text-foreground text-base">You Save ₹{savingsAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: INVENTORY & STATUS */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">3. Inventory & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-sm">Stock Quantity *</FormLabel>
                      <FormControl><Input type="number" {...field} placeholder="10" className="h-11" required /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-sm">SKU (Optional)</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} placeholder="SKU-1001" className="h-11" /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-sm">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'active'}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active (Visible)</SelectItem>
                          <SelectItem value="draft">Draft (Hidden)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: IMAGES */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">4. Product Images (Select & Drag & Drop)</CardTitle>
              <CardDescription>Drag and drop multiple images or click to select from your device / media library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Thumbnail */}
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm">Main Thumbnail</FormLabel>
                    <div className="space-y-3">
                      <ImageDropzone 
                        bucket="products"
                        multiple={false}
                        label="Drag & drop thumbnail image or click to select file"
                        onUploadSuccess={(urls) => {
                          if (urls[0]) form.setValue('thumbnail', urls[0]);
                        }} 
                      />
                      
                      <div className="flex gap-3 items-center">
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Or paste image URL (https://...)" className="h-11" /></FormControl>
                        <MediaPickerModal 
                          defaultBucket="products"
                          multiple={false}
                          onSelect={(url) => form.setValue('thumbnail', url)} 
                          trigger={<Button type="button" variant="outline" className="h-11 shrink-0">Browse Library</Button>}
                        />
                      </div>

                      {field.value && (
                        <div className="relative w-28 h-28 rounded-xl overflow-hidden border bg-secondary/20 group">
                          <img src={field.value} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => form.setValue('thumbnail', '')}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              {/* Gallery */}
              <div>
                <Label className="mb-2 block font-semibold text-sm">Product Gallery Images</Label>
                
                <ImageDropzone 
                  bucket="products"
                  multiple={true}
                  className="mb-4"
                  label="Drag & drop multiple product gallery images here or click to select files"
                  onUploadSuccess={(urls) => {
                    urls.forEach(url => appendGallery({ url }));
                  }} 
                />

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
                  {galleryFields.map((item, idx) => (
                    <div key={item.id} className="relative aspect-square border rounded-xl overflow-hidden group bg-secondary/30">
                      <img src={form.watch(`gallery.${idx}.url`)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGallery(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <MediaPickerModal 
                    defaultBucket="products"
                    multiple
                    onSelect={(url) => appendGallery({ url })}
                    trigger={
                      <div className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground">
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold">Browse Library</span>
                      </div>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: HOMEPAGE TAGS */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">5. Homepage Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-3.5">
                      <FormLabel className="font-semibold text-sm">Featured Product</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_trending"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-3.5">
                      <FormLabel className="font-semibold text-sm">Trending Product</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_new_arrival"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-3.5">
                      <FormLabel className="font-semibold text-sm">New Arrival</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_best_seller"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-3.5">
                      <FormLabel className="font-semibold text-sm">Best Seller</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: OPTIONAL SEO (Collapsed by default) */}
          <details className="border rounded-2xl bg-card overflow-hidden shadow-sm group">
            <summary className="p-4 font-bold text-sm cursor-pointer flex items-center justify-between hover:bg-secondary/20 transition-colors">
              <span>6. SEO (Optional Search Engine Optimization)</span>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-4 pt-0 space-y-4 border-t mt-2">
              <FormField
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">SEO Title</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} placeholder="Meta Title..." className="h-10" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">SEO Meta Description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ''} placeholder="Meta Description..." /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/admin/products')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={saveMutation.isPending} className="shadow-md">
              {saveMutation.isPending ? 'Saving Product...' : (isEditing ? 'Update Product' : 'Save Product')}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
