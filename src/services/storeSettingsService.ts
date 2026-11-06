import { supabase } from '../lib/supabase';

export interface StoreSettings {
  id: number;
  site_name?: string;
  contact_email?: string;
  contact_number?: string;
  whatsapp_number?: string;
  business_address?: string;
  currency_symbol?: string;
  currency_code?: string;
  
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  
  footer_text?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  google_maps_url?: string;
  
  gst_number?: string;
  store_timing?: string;
  enable_cod?: boolean;
  base_shipping_charge?: number;
  free_shipping_threshold?: number;
  delivery_time_text?: string;

  // 4 Editable Storefront Perks
  perk1_title?: string;
  perk1_subtitle?: string;
  perk2_title?: string;
  perk2_subtitle?: string;
  perk3_title?: string;
  perk3_subtitle?: string;
  perk4_title?: string;
  perk4_subtitle?: string;

  // Editable About Us Fields
  about_subtitle?: string;
  about_title?: string;
  about_story?: string;
  about_perk1_title?: string;
  about_perk1_desc?: string;
  about_perk2_title?: string;
  about_perk2_desc?: string;
  about_perk3_title?: string;
  about_perk3_desc?: string;
  
  announcement_bar_active?: boolean;
  announcement_text?: string;
  announcement_link?: string;
  maintenance_mode?: boolean;
  
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  google_analytics_id?: string;
  google_site_verification?: string;
}

const LOCAL_SETTINGS_KEY = 'snapgem_store_settings_fallback';

export const storeSettingsService = {
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1);
        
      if (!error && data && data.length > 0) {
        return data[0] as StoreSettings;
      }
    } catch (e) {
      console.warn('Error fetching store_settings from DB (using local fallback):', e);
    }
    
    const savedLocal = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (savedLocal) {
      try {
        return JSON.parse(savedLocal) as StoreSettings;
      } catch (err) {}
    }

    return {
      id: 1,
      site_name: 'SnapGem Store',
      whatsapp_number: '918669210030',
      currency_symbol: '₹',
      currency_code: 'INR',
      perk1_title: 'Express Shipping',
      perk1_subtitle: 'Free shipping across India',
      perk2_title: '100% Certified',
      perk2_subtitle: 'Authentic hallmark gold & diamonds',
      perk3_title: 'WhatsApp Assistance',
      perk3_subtitle: 'Direct seller chat & sizing help',
      perk4_title: 'Easy Returns',
      perk4_subtitle: 'Hassle-free replacement policy'
    } as StoreSettings;
  },

  async updateSettings(updates: Partial<StoreSettings>) {
    let payload: any = { id: 1, ...updates };

    // Backup to local storage instantly
    try {
      const currentLocal = localStorage.getItem(LOCAL_SETTINGS_KEY);
      const prevObj = currentLocal ? JSON.parse(currentLocal) : {};
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify({ ...prevObj, ...payload }));
    } catch (err) {}

    // Retry loop stripping unmapped columns if schema cache lacks them
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data, error } = await supabase
        .from('store_settings')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        return data as StoreSettings;
      }

      if (error && error.message && error.message.includes("Could not find the '")) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && missingColumn in payload) {
          console.warn(`Stripping unmapped column '${missingColumn}' from store_settings payload and retrying...`);
          delete payload[missingColumn];
          continue;
        }
      }

      console.warn('Error updating store_settings DB (saved to LocalStorage fallback):', error?.message);
      return payload as StoreSettings;
    }

    return payload as StoreSettings;
  }
};
