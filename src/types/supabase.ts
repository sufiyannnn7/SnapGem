export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          deleted_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country: string
          created_at?: string
          deleted_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
        }
      }
      attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          value?: string
        }
      }
      attributes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
      }
      banners: {
        Row: {
          created_at: string
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
      }
      cart: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          end_date: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          start_date: string | null
          times_used: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          start_date?: string | null
          times_used?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          start_date?: string | null
          times_used?: number
          usage_limit?: number | null
        }
      }
      homepage_sections: {
        Row: {
          display_order: number
          id: string
          is_enabled: boolean | null
          section_type: Database["public"]["Enums"]["homepage_section_type"]
          settings: Json
          updated_at: string
        }
        Insert: {
          display_order: number
          id?: string
          is_enabled?: boolean | null
          section_type: Database["public"]["Enums"]["homepage_section_type"]
          settings?: Json
          updated_at?: string
        }
        Update: {
          display_order?: number
          id?: string
          is_enabled?: boolean | null
          section_type?: Database["public"]["Enums"]["homepage_section_type"]
          settings?: Json
          updated_at?: string
        }
      }
      media_library: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string
          file_size: number | null
          folder: string | null
          id: string
          mime_type: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name: string
          file_size?: number | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_size?: number | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          url?: string
        }
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link_url: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          title?: string
          user_id?: string
        }
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          variant_id?: string | null
        }
      }
      order_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
      }
      orders: {
        Row: {
          address_id: string | null
          coupon_code: string | null
          created_at: string
          deleted_at: string | null
          discount: number
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          coupon_code?: string | null
          created_at?: string
          deleted_at?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          coupon_code?: string | null
          created_at?: string
          deleted_at?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
      }
      product_attributes: {
        Row: {
          attribute_id: string
          product_id: string
        }
        Insert: {
          attribute_id: string
          product_id: string
        }
        Update: {
          attribute_id?: string
          product_id?: string
        }
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
      }
      product_variants: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          mrp: number | null
          price: number | null
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          mrp?: number | null
          price?: number | null
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          mrp?: number | null
          price?: number | null
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          is_trending: boolean | null
          mrp: number | null
          name: string
          selling_price: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string | null
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_trending?: boolean | null
          mrp?: number | null
          name: string
          selling_price: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_trending?: boolean | null
          mrp?: number | null
          name?: string
          selling_price?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          thumbnail?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
      }
      store_settings: {
        Row: {
          accent_color: string | null
          announcement_bar_active: boolean | null
          announcement_text: string | null
          business_address: string | null
          contact_email: string | null
          contact_number: string | null
          currency_code: string | null
          currency_symbol: string | null
          favicon_url: string | null
          id: number
          logo_url: string | null
          maintenance_mode: boolean | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_title: string | null
          shipping_base_charge: number | null
          shipping_free_threshold: number | null
          site_name: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string | null
          announcement_bar_active?: boolean | null
          announcement_text?: string | null
          business_address?: string | null
          contact_email?: string | null
          contact_number?: string | null
          currency_code?: string | null
          currency_symbol?: string | null
          favicon_url?: string | null
          id?: number
          logo_url?: string | null
          maintenance_mode?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_base_charge?: number | null
          shipping_free_threshold?: number | null
          site_name?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string | null
          announcement_bar_active?: boolean | null
          announcement_text?: string | null
          business_address?: string | null
          contact_email?: string | null
          contact_number?: string | null
          currency_code?: string | null
          currency_symbol?: string | null
          favicon_url?: string | null
          id?: number
          logo_url?: string | null
          maintenance_mode?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_base_charge?: number | null
          shipping_free_threshold?: number | null
          site_name?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
      }
      variant_attribute_values: {
        Row: {
          attribute_value_id: string
          variant_id: string
        }
        Insert: {
          attribute_value_id: string
          variant_id: string
        }
        Update: {
          attribute_value_id?: string
          variant_id?: string
        }
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
      }
    }
    Enums: {
      admin_role: "admin" | "manager" | "staff"
      discount_type: "percentage" | "fixed"
      homepage_section_type:
        | "hero"
        | "featured_collections"
        | "trending_products"
        | "flash_sale"
        | "new_arrivals"
        | "testimonials"
        | "newsletter"
        | "custom_html"
        | "banner"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status: "pending" | "paid" | "failed" | "refunded"
    }
  }
}
