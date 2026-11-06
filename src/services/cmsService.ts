import { supabase } from '../lib/supabase';

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  section_type: 'hero' | 'categories' | 'featured_products' | 'trending_products' | 'flash_sale' | 'new_arrivals' | 'testimonials' | 'newsletter' | 'custom_html';
  display_order: number;
  is_enabled: boolean;
  settings: Record<string, any>;
  updated_at?: string;
}

const LOCAL_STORAGE_HOMEPAGE_KEY = 'snapgem_homepage_sections_fallback';

export const cmsService = {
  // Pages
  async getPages() {
    try {
      const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Page[];
    } catch (e) {
      console.warn('Error fetching pages from Supabase (using empty list fallback):', e);
      return [];
    }
  },

  async getPageBySlug(slug: string) {
    try {
      const { data, error } = await supabase.from('pages').select('*').eq('slug', slug).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Page;
    } catch (e) {
      console.warn(`Error fetching page ${slug}:`, e);
      return null;
    }
  },

  async getPageById(id: string) {
    try {
      const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Page;
    } catch (e) {
      return null;
    }
  },

  async createPage(page: Partial<Page>) {
    const { data, error } = await supabase.from('pages').insert([page]).select().single();
    if (error) throw error;
    return data as Page;
  },

  async updatePage(id: string, updates: Partial<Page>) {
    const { data, error } = await supabase.from('pages').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Page;
  },

  async deletePage(id: string) {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
  },

  // Homepage Builder with automatic Supabase & LocalStorage Fallback
  async getHomepageSections() {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as HomepageSection[];
      }
    } catch (e) {
      console.warn('Supabase homepage_sections table missing or error (using fallback):', e);
    }

    // Fallback to localStorage
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_HOMEPAGE_KEY);
    if (savedLocal) {
      try {
        return JSON.parse(savedLocal) as HomepageSection[];
      } catch (err) {}
    }

    return [
      { id: '1', section_type: 'hero', display_order: 0, is_enabled: true, settings: { title: 'Elevate Your Everyday', subtitle: 'LUXURY FINE JEWELRY & ACCESSORIES', button_text: 'Explore Collection', button_link: '/shop' } },
      { id: '2', section_type: 'categories', display_order: 1, is_enabled: true, settings: { title: 'Shop by Category', subtitle: 'COLLECTIONS' } },
      { id: '3', section_type: 'featured_products', display_order: 2, is_enabled: true, settings: { title: 'Featured Fine Jewelry', subtitle: 'CURATED LUXURY' } },
      { id: '4', section_type: 'trending_products', display_order: 3, is_enabled: true, settings: { title: 'Trending This Season', subtitle: 'BESTSELLERS' } },
      { id: '5', section_type: 'testimonials', display_order: 4, is_enabled: true, settings: {} }
    ] as HomepageSection[];
  },

  async saveHomepageSections(sections: Partial<HomepageSection>[]) {
    // 1. Always save to LocalStorage as instant backup
    localStorage.setItem(LOCAL_STORAGE_HOMEPAGE_KEY, JSON.stringify(sections));

    // 2. Try saving to Supabase if table exists
    try {
      const { error: deleteError } = await supabase
        .from('homepage_sections')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (!deleteError && sections.length > 0) {
        const inserts = sections.map((s, index) => ({
          section_type: s.section_type,
          display_order: index,
          is_enabled: s.is_enabled !== undefined ? s.is_enabled : true,
          settings: s.settings || {}
        }));
        const { data, error: insertError } = await supabase.from('homepage_sections').insert(inserts).select();
        if (!insertError && data) {
          return data as HomepageSection[];
        }
      }
    } catch (e) {
      console.warn('Supabase homepage_sections table insert warning (saved to localStorage):', e);
    }

    return sections as HomepageSection[];
  },

  // Banners
  async getBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  },

  async createBanner(banner: any) {
    const { data, error } = await supabase.from('banners').insert(banner).select().single();
    if (error) throw error;
    return data;
  },

  async updateBanner(id: string, updates: any) {
    const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteBanner(id: string) {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
  }
};
