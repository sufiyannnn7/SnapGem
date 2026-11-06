import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react';
import { cmsService } from '@/services/cmsService';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { storeSettingsService } from '@/services/storeSettingsService';
import { ProductCard } from '@/components/ui/ProductCard';

export function Home() {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['public_homepage_sections'],
    queryFn: async () => {
      try {
        return await cmsService.getHomepageSections();
      } catch (e) {
        console.warn('Error fetching homepage sections:', e);
        return [];
      }
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold">Loading SnapGem Store...</p>
        </div>
      </div>
    );
  }

  // Ensure sections always put Hero 1st and Categories 2nd (top of 1st page)
  const orderedSections = [...sections];
  
  // Find hero and categories sections or supply defaults
  const heroSec = orderedSections.find(s => s.section_type === 'hero') || { id: 'hero-default', section_type: 'hero', display_order: 0, is_enabled: true, settings: {} };
  const categoriesSec = orderedSections.find(s => s.section_type === 'categories') || { id: 'cat-default', section_type: 'categories', display_order: 1, is_enabled: true, settings: { title: 'Shop by Category', subtitle: 'COLLECTIONS' } };
  
  const remainingSections = orderedSections.filter(s => s.section_type !== 'hero' && s.section_type !== 'categories');
  if (remainingSections.length === 0) {
    remainingSections.push(
      { id: '3', section_type: 'featured_products', display_order: 2, is_enabled: true, settings: { title: 'Featured Fine Jewelry', subtitle: 'CURATED LUXURY' } },
      { id: '4', section_type: 'trending_products', display_order: 3, is_enabled: true, settings: { title: 'Trending Right Now', subtitle: 'HANDPICKED FAVORITES' } },
      { id: '5', section_type: 'testimonials', display_order: 4, is_enabled: true, settings: {} }
    );
  }

  const finalSections = [heroSec, categoriesSec, ...remainingSections];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {finalSections.map((section: any) => {
        if (!section.is_enabled) return null;

        switch (section.section_type) {
          case 'hero':
            return <HeroSection key={section.id} section={section} settings={settings} />;
          case 'categories':
            return <CategoriesSection key={section.id} section={section} />;
          case 'featured_products':
            return <ProductsGridSection key={section.id} section={section} filter="featured" />;
          case 'trending_products':
            return <ProductsGridSection key={section.id} section={section} filter="trending" />;
          case 'flash_sale':
            return <FlashSaleSection key={section.id} section={section} />;
          case 'testimonials':
            return <TestimonialsSection key={section.id} section={section} />;
          case 'newsletter':
            return <NewsletterSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}

      {/* Perks Banner */}
      <section className="py-6 bg-secondary/30 border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Truck className="w-5 h-5 text-foreground" />
              <h4 className="font-bold text-xs">{settings?.perk1_title || 'Express Shipping'}</h4>
              <p className="text-[11px] text-muted-foreground">{settings?.perk1_subtitle || 'Free shipping across India'}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <ShieldCheck className="w-5 h-5 text-foreground" />
              <h4 className="font-bold text-xs">{settings?.perk2_title || '100% Certified'}</h4>
              <p className="text-[11px] text-muted-foreground">{settings?.perk2_subtitle || 'Authentic hallmark gold & diamonds'}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <MessageSquare className="w-5 h-5 text-foreground" />
              <h4 className="font-bold text-xs">{settings?.perk3_title || 'WhatsApp Assistance'}</h4>
              <p className="text-[11px] text-muted-foreground">{settings?.perk3_subtitle || 'Direct seller chat & sizing help'}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <RefreshCw className="w-5 h-5 text-foreground" />
              <h4 className="font-bold text-xs">{settings?.perk4_title || 'Easy Returns'}</h4>
              <p className="text-[11px] text-muted-foreground">{settings?.perk4_subtitle || 'Hassle-free replacement policy'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroSection({ section }: { section: any; settings: any }) {
  const title = section.settings?.title || 'Elevate Your Everyday';
  const subtitle = section.settings?.subtitle || 'LUXURY FINE JEWELRY & ACCESSORIES';
  const buttonText = section.settings?.button_text || 'Explore Collection';
  const buttonLink = section.settings?.button_link || '/shop';
  const imageUrl = section.settings?.bg_image || section.settings?.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600';

  return (
    <>
      {/* MOBILE ONLY (< md): Banner UP, All Content DOWN */}
      <section className="block md:hidden pt-12 pb-2 bg-background border-b border-border/40">
        <div className="container mx-auto px-3">
          {/* Banner UP on Mobile */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-border/40 mb-1.5 bg-secondary/20 flex items-center justify-center p-1">
            <img 
              src={imageUrl} 
              alt="Hero Banner" 
              className="w-full h-auto max-h-[170px] object-contain rounded-xl" 
            />
          </div>

          {/* All Remaining Content DOWN on Mobile */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-0.5 py-0.5"
          >
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground block">{subtitle}</span>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">{title}</h1>
            <div className="pt-1.5">
              <Link
                to={buttonLink}
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover-elevate transition-all duration-300 shadow-md"
              >
                {buttonText} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DESKTOP ONLY (>= md): Full Background Hero Overlay */}
      <section className="hidden md:flex relative min-h-[48vh] items-center justify-center overflow-hidden pt-20 pb-8 border-b border-border/40">
        <div className="absolute inset-0 z-0">
          <img src={imageUrl} alt="Hero Banner" className="w-full h-full object-cover opacity-90 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground block">{subtitle}</span>
            <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">{title}</h1>
            
            <div className="pt-2">
              <Link
                to={buttonLink}
                className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover-elevate transition-all duration-300 shadow-lg"
              >
                {buttonText} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function CategoriesSection({ section }: { section: any }) {
  const { data: categories = [] } = useQuery({
    queryKey: ['public_categories'],
    queryFn: categoryService.getCategories
  });

  const selectedCategoryIds: string[] = section.settings?.selected_categories || [];
  
  let activeCategories = categories.filter(c => c.is_active);
  if (selectedCategoryIds.length > 0) {
    activeCategories = activeCategories.filter(c => selectedCategoryIds.includes(c.id));
  }

  // Default fallback categories with high resolution jewelry images
  const defaultFallbackCategories = [
    { id: 'cat-1', name: 'Rings', slug: 'rings', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600' },
    { id: 'cat-2', name: 'Necklaces', slug: 'necklaces', image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600' },
    { id: 'cat-3', name: 'Earrings', slug: 'earrings', image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600' },
    { id: 'cat-4', name: 'Bracelets', slug: 'bracelets', image_url: 'https://images.unsplash.com/photo-1611591475165-da255c4d0089?auto=format&fit=crop&q=80&w=600' },
    { id: 'cat-5', name: 'Pendants', slug: 'pendants', image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600' },
    { id: 'cat-6', name: 'Luxury Sets', slug: 'sets', image_url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=600' }
  ];

  // Combine DB categories with default fallbacks so at least 6 categories fill out the horizontal row
  let combinedCategories = [...activeCategories];
  defaultFallbackCategories.forEach(def => {
    if (combinedCategories.length < 6 && !combinedCategories.some(c => c.slug === def.slug || c.name.toLowerCase() === def.name.toLowerCase())) {
      combinedCategories.push(def as any);
    }
  });

  return (
    <section className="py-6 bg-background relative z-20 border-b border-border/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground block">{section.settings?.subtitle || 'COLLECTIONS'}</span>
            <h2 className="text-xl md:text-2xl font-bold">{section.settings?.title || 'Shop by Category'}</h2>
          </div>
          <Link to="/shop" className="text-xs font-semibold hover:text-muted-foreground transition-colors flex items-center gap-1 group">
            View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Large Prominent Category Circle Row */}
        <div className="flex items-center justify-between gap-4 sm:gap-8 overflow-x-auto pb-4 pt-2 hide-scrollbar snap-x">
          {combinedCategories.slice(0, 8).map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="flex-shrink-0 text-center snap-center flex flex-col items-center"
            >
              <Link to={`/shop?category=${category.slug || category.name.toLowerCase()}`} className="group flex flex-col items-center gap-3">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden border-2 border-border/80 group-hover:border-foreground relative bg-gradient-to-tr from-neutral-200 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-muted-foreground">
                      {category.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsGridSection({ section, filter }: { section: any; filter: 'featured' | 'trending' }) {
  const { data: products = [] } = useQuery({
    queryKey: ['public_products_grid', filter],
    queryFn: () => productService.getProducts({
      status: 'active',
      isFeatured: filter === 'featured' ? true : undefined
    })
  });

  const displayProducts = filter === 'trending'
    ? products.filter(p => p.is_trending).slice(0, 6)
    : products.slice(0, 6);

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            {section.settings?.subtitle && (
              <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5 block">{section.settings.subtitle}</span>
            )}
            <h2 className="text-xl md:text-2xl font-bold">{section.settings?.title || (filter === 'featured' ? 'Featured Fine Jewelry' : 'Trending Right Now')}</h2>
          </div>
          <Link to="/shop" className="text-xs font-semibold hover:text-muted-foreground transition-colors flex items-center gap-1 group">
            Explore All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayProducts.map((p, idx) => (
            <ProductCard key={p.id} product={p} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlashSaleSection({ section }: { section: any }) {
  return (
    <section className="py-10 bg-foreground text-background">
      <div className="container mx-auto px-4 md:px-6 text-center space-y-4 max-w-xl">
        <span className="text-[11px] font-bold uppercase tracking-widest text-background/70">LIMITED TIME OFFER</span>
        <h2 className="text-2xl md:text-4xl font-bold">{section.settings?.title || 'Exclusive Flash Sale'}</h2>
        <p className="text-xs text-background/80 leading-relaxed">
          {section.settings?.subtitle || 'Get up to 30% OFF on handcrafted fine gold & diamond jewelry.'}
        </p>
        <div className="pt-1">
          <Link to="/shop" className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md">
            Shop Flash Sale <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section }: { section: any }) {
  return (
    <section className="py-8 bg-secondary/20">
      <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-1 block">REVIEWS</span>
        <h2 className="text-xl md:text-2xl font-bold mb-6">What Our Clients Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="p-5 border rounded-2xl bg-card space-y-2 shadow-sm">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              "The diamond necklace exceeded my expectations. Direct WhatsApp order was fast and delivery was seamless!"
            </p>
            <p className="text-[11px] font-bold text-foreground">- Priya Sharma, Mumbai</p>
          </div>
          <div className="p-5 border rounded-2xl bg-card space-y-2 shadow-sm">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              "Beautiful craftsmanship on the gold ring. Customer support on WhatsApp answered all my sizing questions."
            </p>
            <p className="text-[11px] font-bold text-foreground">- Ananya Patel, Ahmedabad</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ section }: { section: any }) {
  return (
    <section className="py-8 bg-background border-t border-border">
      <div className="container mx-auto px-4 md:px-6 text-center max-w-md space-y-3">
        <h3 className="text-xl font-bold">Join the SnapGem Club</h3>
        <p className="text-xs text-muted-foreground">Subscribe to receive private sale access and new collection releases.</p>
        <div className="flex gap-2 max-w-sm mx-auto pt-1">
          <input type="email" placeholder="Enter your email address" className="flex-1 h-10 border rounded-full px-4 text-xs bg-background focus:outline-none" />
          <button className="bg-foreground text-background font-bold text-xs px-5 rounded-full hover:opacity-90 transition-opacity">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
}
