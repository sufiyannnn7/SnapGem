import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, SlidersHorizontal, X, ArrowUpDown, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/ui/ProductCard';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  const categoryParam = searchParams.get('category');
  const sortParam = searchParams.get('sort') || 'newest';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: categories = [], error: categoriesError } = useQuery({
    queryKey: ['public_categories'],
    queryFn: categoryService.getCategories
  });

  if (categoriesError) console.error("Error loading categories:", categoriesError);

  const { data: products = [], isLoading, error: productsError } = useQuery({
    queryKey: ['public_products', categoryParam],
    queryFn: () => productService.getProducts({ 
      status: 'active',
      categorySlug: categoryParam
    })
  });

  if (productsError) console.error("Error loading products:", productsError);

  const handleCategorySelect = (slug: string | null) => {
    const params: Record<string, string> = {};
    if (slug) params.category = slug;
    if (sortParam && sortParam !== 'newest') params.sort = sortParam;
    setSearchParams(params);
  };

  const handleSortSelect = (sortValue: string) => {
    const params: Record<string, string> = {};
    if (categoryParam) params.category = categoryParam;
    if (sortValue !== 'newest') params.sort = sortValue;
    setSearchParams(params);
    setIsSortOpen(false);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
  ];

  const currentSortLabel = sortOptions.find(o => o.value === sortParam)?.label || 'Newest Arrivals';

  // Client-Side Sorting Engine
  const sortedProducts = [...products].sort((a, b) => {
    if (sortParam === 'price_low') {
      return Number(a.selling_price || 0) - Number(b.selling_price || 0);
    }
    if (sortParam === 'price_high') {
      return Number(b.selling_price || 0) - Number(a.selling_price || 0);
    }
    if (sortParam === 'name_asc') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortParam === 'name_desc') {
      return (b.name || '').localeCompare(a.name || '');
    }
    // 'newest' default (created_at descending)
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const activeCategories = categories.filter(c => c.is_active);

  return (
    <div className="pt-16 md:pt-24 min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 md:px-6 py-2 sm:py-6">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-4 md:mb-8 gap-2 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-medium mb-1">The Collection</h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Curated fine jewelry & accessories for a refined lifestyle.</p>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end mt-1 md:mt-0">
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1.5 border border-border px-3.5 py-1.5 rounded-full hover:bg-secondary transition-colors md:hidden text-[11px] font-bold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters & Sort
            </button>

            {/* Interactive Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">Sort by:</span>
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-1.5 bg-secondary/60 hover:bg-secondary border border-border/80 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-xs"
                >
                  <span>{currentSortLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Sort Menu Overlay */}
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-30 py-2"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b mb-1">
                      Sort Products By
                    </div>
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortSelect(opt.value)}
                        className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-secondary/70 transition-colors ${
                          sortParam === opt.value ? 'text-foreground font-bold bg-secondary/40' : 'text-muted-foreground'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortParam === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Category Pill Buttons (Compact Spacing) */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-4 pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <button 
            onClick={() => handleCategorySelect(null)}
            className={`px-3.5 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap transition-all ${
              !categoryParam ? 'bg-foreground text-background border-foreground shadow-sm' : 'bg-background border-border text-foreground hover:border-foreground'
            }`}
          >
            All Products
          </button>
          {activeCategories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap transition-all ${
                categoryParam === cat.slug ? 'bg-foreground text-background border-foreground shadow-sm' : 'bg-background border-border text-foreground hover:border-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-32 space-y-6">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Categories
                </h3>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => handleCategorySelect(null)}
                      className={`text-xs hover:text-foreground transition-colors text-left w-full ${!categoryParam ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                    >
                      All Products ({products.length})
                    </button>
                  </li>
                  {activeCategories.map(cat => (
                    <li key={cat.id}>
                      <button 
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`text-xs hover:text-foreground transition-colors text-left w-full ${categoryParam === cat.slug ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Product Grid (Compact 4-Column Desktop Layout) */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center text-xs text-muted-foreground font-medium">
              <span>Showing {sortedProducts.length} product(s)</span>
            </div>
            
            {isLoading ? (
               <div className="py-24 text-center text-muted-foreground text-sm">Loading products...</div>
            ) : (
              /* Desktop: 4 Columns | Mobile: 2 Columns */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 gap-y-8">
                <AnimatePresence mode="popLayout">
                  {sortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard product={product} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            {!isLoading && sortedProducts.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-lg text-muted-foreground mb-4">No products found in this category.</p>
                <button 
                  onClick={() => handleCategorySelect(null)}
                  className="border border-foreground px-6 py-2.5 rounded-full text-xs font-bold uppercase hover:bg-foreground hover:text-background transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter & Sort Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-background z-50 rounded-t-3xl shadow-2xl p-6 md:hidden overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-serif font-bold text-xl">Filter & Sort</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Sort Options */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sort By
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { handleSortSelect(opt.value); setIsFilterOpen(false); }}
                      className={`px-4 py-3 rounded-xl border text-xs font-bold text-left flex justify-between items-center ${
                        sortParam === opt.value ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortParam === opt.value && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Categories */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { handleCategorySelect(null); setIsFilterOpen(false); }}
                    className={`px-4 py-2 rounded-full border text-xs font-bold ${!categoryParam ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground'}`}
                  >
                    All Products
                  </button>
                  {activeCategories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => { handleCategorySelect(cat.slug); setIsFilterOpen(false); }}
                      className={`px-4 py-2 rounded-full border text-xs font-bold ${categoryParam === cat.slug ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full bg-foreground text-background py-3.5 rounded-full font-bold text-xs uppercase shadow-md"
              >
                Apply & View Products ({sortedProducts.length})
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}