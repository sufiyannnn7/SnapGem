import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, Image as ImageIcon, ChevronRight, Home, Info, PhoneCall, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { useQuery } from '@tanstack/react-query';
import { storeSettingsService } from '@/services/storeSettingsService';
import { productService } from '@/services/productService';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  const { data: products = [] } = useQuery({
    queryKey: ['public_products_search'],
    queryFn: () => productService.getProducts({ status: 'active' }),
    enabled: searchOpen
  });

  const searchResults = searchQuery.trim().length > 0 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase())))
    : [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  const storeTitle = settings?.site_name || 'SNAPGEM STORE';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass py-2.5 shadow-sm' : 'bg-background/95 backdrop-blur-md py-3.5 border-b border-border/30'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -ml-2 text-foreground"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Premium Logo (Big Circle Icon + Store Name Beside It) */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            {settings?.logo_url ? (
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center p-1 rounded-full bg-white dark:bg-neutral-900 border border-border/80 shadow-md group-hover:scale-105 transition-all">
                <img 
                  src={settings.logo_url} 
                  alt={storeTitle} 
                  className="h-full w-full object-contain rounded-full" 
                />
              </div>
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm sm:text-base">
                SG
              </div>
            )}
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground font-serif group-hover:text-primary transition-colors">
              {storeTitle}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground hover:after:w-full after:transition-all after:duration-300"
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground hover:after:w-full after:transition-all after:duration-300"
            >
              Shop All
            </Link>
            <Link 
              to="/page/about-us" 
              className="text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground hover:after:w-full after:transition-all after:duration-300"
            >
              About Us
            </Link>
            <Link 
              to="/page/contact" 
              className="text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground hover:after:w-full after:transition-all after:duration-300"
            >
              Contact
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 text-foreground hover:opacity-70 transition-opacity"
              title="Search store"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link to="/cart" id="navbar-cart-button" className="p-2 text-foreground hover:opacity-70 transition-opacity relative group">
              <ShoppingBag className="w-5.5 h-5.5" />
              <AnimatePresence mode="wait">
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: [1.8, 0.85, 1], opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 13 }}
                    className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[11px] font-extrabold min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-xl border-2 border-background ring-2 ring-orange-500/40"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Overlay with Premium Glassmorphism */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Dark Glass Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Solid Glassmorphism Drawer Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-background border-r border-border/80 z-50 p-6 shadow-2xl flex flex-col justify-between md:hidden"
              >
                <div>
                  {/* Top Bar Logo & Close */}
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/50">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                      {settings?.logo_url ? (
                        <div className="h-10 w-10 flex items-center justify-center p-1 rounded-full bg-white dark:bg-neutral-900 border border-border/80 shadow-xs">
                          <img src={settings.logo_url} alt={storeTitle} className="h-full w-full object-contain rounded-full" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs">
                          SG
                        </div>
                      )}
                      <span className="text-base font-bold tracking-tight text-foreground font-serif">
                        {storeTitle}
                      </span>
                    </Link>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-foreground hover:bg-secondary rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Solid Luxury Menu Options */}
                  <nav className="flex flex-col gap-2.5">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border/70 transition-all flex items-center justify-between shadow-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
                        <span className="text-sm font-bold text-foreground">Home</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground/50 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link 
                      to="/shop" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border/70 transition-all flex items-center justify-between shadow-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
                        <span className="text-sm font-bold text-foreground">Shop All</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground/50 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link 
                      to="/page/about-us" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border/70 transition-all flex items-center justify-between shadow-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <Info className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
                        <span className="text-sm font-bold text-foreground">About Us</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground/50 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link 
                      to="/page/contact" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border/70 transition-all flex items-center justify-between shadow-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <PhoneCall className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
                        <span className="text-sm font-bold text-foreground">Contact Us</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground/50 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Global Search Dialog Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search products by name or category..." 
              className="flex-1 bg-transparent border-none text-base focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
            {searchQuery.trim().length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Type to search catalog...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">No products found matching "{searchQuery}".</div>
            ) : (
              searchResults.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    navigate(`/product/${p.slug || p.id}`);
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0 border">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground m-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category?.name || 'Jewelry'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">₹{Number(p.selling_price || p.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
