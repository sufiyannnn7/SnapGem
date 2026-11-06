import { supabase } from '../lib/supabase';
import { Category } from './categoryService';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number | null;
  mrp: number | null;
  stock: number;
  image_url: string | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  specifications: Record<string, any>;
  selling_price: number;
  price?: number;
  mrp: number | null;
  cost_price?: number;
  thumbnail?: string;
  stock: number;
  status?: string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_trending: boolean;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

function normalizeProduct(p: any): Product {
  if (!p) return p;
  const selling = Number(p.selling_price ?? p.price ?? 0);
  return {
    ...p,
    selling_price: selling,
    price: selling,
    mrp: p.mrp ?? selling,
    stock: Number(p.stock ?? 0)
  };
}

export const productService = {
  async getProducts({
    categorySlug,
    isFeatured,
    status,
    search,
    categoryId
  }: {
    categorySlug?: string | null;
    isFeatured?: boolean;
    status?: string;
    search?: string;
    categoryId?: string;
  } = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (categorySlug) {
      const { data: catData } = await supabase.from('categories').select('id').eq('slug', categorySlug).limit(1);
      if (catData && catData.length > 0) {
        query = query.eq('category_id', catData[0].id);
      }
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    const products = (data || []).map(normalizeProduct);
    products.forEach(p => {
      if (p.images) {
        p.images.sort((a, b) => a.display_order - b.display_order);
      }
    });

    return products;
  },

  async getProductBySlug(slug: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('slug', slug)
      .limit(1);
      
    if (error || !data || data.length === 0) throw error || new Error('Product not found');
    
    const product = normalizeProduct(data[0]);
    if (product.images) {
      product.images.sort((a, b) => a.display_order - b.display_order);
    }
    
    return product;
  },

  async createProduct(product: Partial<Product>) {
    let payload: any = { ...product };

    // Sync price and selling_price
    const priceVal = payload.selling_price || payload.price || 0;
    payload.selling_price = priceVal;
    payload.price = priceVal;

    if (!payload.slug && payload.name) {
      payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Retry loop handling column mismatches and duplicate slug unique constraints
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return normalizeProduct(data);
      }

      // 1. Auto-resolve duplicate slug unique constraint
      if (error && error.message && (error.message.includes('products_slug_key') || error.message.includes('duplicate key value'))) {
        const randomHash = Math.random().toString(36).substring(2, 6);
        const baseSlug = payload.slug || (payload.name ? payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product');
        payload.slug = `${baseSlug.replace(/-[a-z0-9]{4}$/, '')}-${randomHash}`;
        console.warn(`[productService] Duplicate slug detected. Auto-resolving slug to '${payload.slug}' and retrying...`);
        continue;
      }

      // 2. Handle missing column schema mismatch
      if (error && error.message && error.message.includes("Could not find the '")) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && missingColumn in payload) {
          console.warn(`[productService] Stripping unmapped column '${missingColumn}' from product payload and retrying...`);
          delete payload[missingColumn];
          continue;
        }
      }

      throw error;
    }

    throw new Error('Failed to create product after multiple retries.');
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    let payload: any = { ...updates };

    if ('selling_price' in payload || 'price' in payload) {
      const priceVal = payload.selling_price ?? payload.price ?? 0;
      payload.selling_price = priceVal;
      payload.price = priceVal;
    }

    // Retry loop handling column mismatches and duplicate slug unique constraints
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return normalizeProduct(data);
      }

      // 1. Auto-resolve duplicate slug unique constraint
      if (error && error.message && (error.message.includes('products_slug_key') || error.message.includes('duplicate key value'))) {
        const randomHash = Math.random().toString(36).substring(2, 6);
        const baseSlug = payload.slug || (payload.name ? payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product');
        payload.slug = `${baseSlug.replace(/-[a-z0-9]{4}$/, '')}-${randomHash}`;
        console.warn(`[productService] Duplicate slug detected on update. Auto-resolving slug to '${payload.slug}' and retrying...`);
        continue;
      }

      // 2. Handle missing column schema mismatch
      if (error && error.message && error.message.includes("Could not find the '")) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && missingColumn in payload) {
          console.warn(`[productService] Stripping unmapped column '${missingColumn}' from product update payload and retrying...`);
          delete payload[missingColumn];
          continue;
        }
      }

      throw error;
    }

    throw new Error('Failed to update product after multiple retries.');
  },

  async deleteProduct(id: string) {
    try {
      // 1. Delete associated product_images and product_variants first to avoid FK constraints
      await supabase.from('product_images').delete().eq('product_id', id);
      await supabase.from('product_variants').delete().eq('product_id', id);
    } catch (e) {}

    // 2. Perform actual DELETE from products table
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[productService] Direct delete failed, archiving as draft:', error);
      const { error: updateErr } = await supabase
        .from('products')
        .update({ status: 'draft' })
        .eq('id', id);

      if (updateErr) throw updateErr;
    }
  },

  async duplicateProduct(id: string) {
    const { data: original, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !original) throw fetchErr || new Error('Product not found');

    const copyData = {
      ...original,
      id: undefined,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      created_at: undefined,
      updated_at: undefined
    };

    return await this.createProduct(copyData);
  },

  async updateProductImages(productId: string, images: { image_url: string, display_order: number }[]) {
    try {
      await supabase.from('product_images').delete().eq('product_id', productId);
      if (images.length > 0) {
        const inserts = images.map(img => ({ product_id: productId, ...img }));
        const { error } = await supabase.from('product_images').insert(inserts);
        if (error) {
          console.warn('[productService] RLS or DB error inserting product_images:', error);
        }
      }
    } catch (err) {
      console.warn('[productService] Failed to sync product_images table:', err);
    }
  },
  
  async updateProductVariants(productId: string, variants: Partial<ProductVariant>[]) {
    try {
      await supabase.from('product_variants').update({ deleted_at: new Date().toISOString() }).eq('product_id', productId);
      
      if (variants.length > 0) {
        const inserts = variants.map(v => ({
          product_id: productId,
          sku: v.sku,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          image_url: v.image_url
        }));
        const { error } = await supabase.from('product_variants').insert(inserts);
        if (error) {
          console.warn('[productService] RLS or DB error inserting product_variants:', error);
        }
      }
    } catch (err) {
      console.warn('[productService] Failed to sync product_variants table:', err);
    }
  }
};
