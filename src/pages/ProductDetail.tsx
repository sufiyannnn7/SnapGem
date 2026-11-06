import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ChevronRight, Star, Truck, ShieldCheck, RefreshCw, ArrowLeft, ZoomIn, MessageSquare, Share2, ChevronLeft, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../hooks/useCart';
import { toast } from 'sonner';
import { productService, Product, ProductVariant } from '@/services/productService';
import { storeSettingsService } from '@/services/storeSettingsService';
import { ProductCard } from '@/components/ui/ProductCard';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  const { data: product, isLoading, error: productError } = useQuery({
    queryKey: ['public_product', id],
    queryFn: () => productService.getProductBySlug(id as string),
    enabled: !!id
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['public_related_products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const all = await productService.getProducts({ status: 'active', categoryId: product.category_id });
      return all.filter(p => p.id !== product.id).slice(0, 4);
    },
    enabled: !!product?.category_id
  });

  const { addItem } = useCart();

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
    if (product?.name) {
      document.title = `${product.name} | ${settings?.site_name || 'SnapGem Store'}`;

      // Dynamic Product JSON-LD structured data with https://snapgem.in domain
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.thumbnail || (product.images?.[0]?.image_url),
        "description": product.description || product.name,
        "sku": product.sku || product.id,
        "offers": {
          "@type": "Offer",
          "url": `https://snapgem.in/product/${product.slug || product.id}`,
          "priceCurrency": "INR",
          "price": product.selling_price || product.price,
          "availability": (product.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      };

      let script = document.getElementById('jsonld-product') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'jsonld-product';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(productSchema);
    }

    return () => {
      const script = document.getElementById('jsonld-product');
      if (script) script.remove();
    };
  }, [product, selectedVariant, settings]);

  if (isLoading) return <div className="pt-32 pb-16 min-h-screen text-center text-muted-foreground">Loading product details...</div>;
  if (productError || !product) return <div className="pt-32 pb-16 min-h-screen text-center">Product not found.</div>;

  const currentSellingPrice = selectedVariant?.price || product.selling_price;
  const currentMRP = selectedVariant?.mrp || product.mrp;
  const discountAmount = currentMRP && currentMRP > currentSellingPrice ? (currentMRP - currentSellingPrice) : 0;
  const discountPercent = currentMRP && currentMRP > currentSellingPrice ? Math.round((discountAmount / currentMRP) * 100) : 0;
  const currentStock = selectedVariant ? selectedVariant.stock : (product.stock !== undefined ? product.stock : 10);
  const inStock = currentStock > 0;
  
  const images: string[] = [];
  if (product.thumbnail) images.push(product.thumbnail);
  if (product.images) images.push(...product.images.map(img => img.image_url));
  const uniqueImages = Array.from(new Set(images));
  if (uniqueImages.length === 0) uniqueImages.push('');

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImage((prev) => (prev + 1) % uniqueImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImage((prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length);
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (!inStock) {
      toast.error('Item is out of stock');
      return;
    }
    addItem(product as any, quantity);

    const displayImage = uniqueImages[selectedImage] || product.thumbnail || '';
    window.dispatchEvent(new CustomEvent('cart-item-added', {
      detail: { 
        x: e ? e.clientX : window.innerWidth / 2, 
        y: e ? e.clientY : window.innerHeight / 2, 
        image: displayImage 
      }
    }));
    toast.success(`${quantity}x ${product.name} added to cart`);
  };

  const handleWhatsAppEnquiry = () => {
    const waNumber = settings?.whatsapp_number || '918669210030';
    const cleanWaNumber = waNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi! I am interested in *${product.name}* (Price: ₹${currentSellingPrice.toFixed(2)}). Could you please share more details or availability?`);
    window.open(`https://wa.me/${cleanWaNumber}?text=${message}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on ${settings?.site_name || 'SnapGem Store'}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  // Structured Data (JSON-LD) for SEO
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.name,
    'image': uniqueImages,
    'description': product.description,
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'INR',
      'price': currentSellingPrice,
      'availability': inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container mx-auto px-4 md:px-6">
        
        {/* Back Button & Share */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3.5 py-1.5 hover:bg-secondary transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight className="w-4 h-4" />
          {product.category && (
            <>
              <Link to={`/shop?category=${product.category.slug}`} className="hover:text-foreground transition-colors">{product.category.name}</Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Image Gallery with Thumbnail List & Lightbox */}
          <div className="lg:w-1/2 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)]">
            {uniqueImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-20 shrink-0 hide-scrollbar pb-2 md:pb-0">
                {uniqueImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${selectedImage === idx ? 'border-foreground shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex-1 relative aspect-[4/5] bg-secondary rounded-2xl overflow-hidden group border border-border/40">
              {uniqueImages[selectedImage] ? (
                <div className="relative w-full h-full overflow-hidden cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                  <motion.img 
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={uniqueImages[selectedImage]} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Prev / Next Arrows */}
                  {uniqueImages.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-md p-2 rounded-full text-foreground shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-md p-2 rounded-full text-foreground shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image counter badge & zoom hint */}
                  <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-foreground shadow-sm">
                    {selectedImage + 1} / {uniqueImages.length}
                  </div>

                  <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md p-2 rounded-full text-foreground shadow-sm">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{product.category.name}</span>
              )}
              {product.is_featured && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Featured</span>}
              {product.is_trending && <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Trending</span>}
            </div>

            <h1 className="text-3xl lg:text-4xl font-serif font-bold leading-tight mb-4">{product.name}</h1>
            
            {/* Price & Savings */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">₹{currentSellingPrice.toFixed(2)}</span>
                {currentMRP && currentMRP > currentSellingPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">₹{currentMRP.toFixed(2)}</span>
                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              {discountAmount > 0 && (
                <p className="text-sm font-semibold text-green-600">
                  You Save ₹{discountAmount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6 space-y-3">
                <label className="text-sm font-bold block text-foreground">Select Option / Variant:</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-foreground bg-foreground text-background shadow-sm'
                          : 'border-border bg-transparent text-foreground hover:bg-secondary'
                      }`}
                    >
                      {variant.name} – ₹{variant.price.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & CTA Buttons */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity:</span>
                <div className="flex items-center border rounded-full h-11 px-2 w-32">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center font-bold">-</button>
                  <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold">+</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 bg-foreground text-background py-4 rounded-full font-bold text-xs uppercase tracking-wider hover-elevate transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <button
                  onClick={handleWhatsAppEnquiry}
                  className="flex-1 bg-green-600 text-white py-4 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" /> Order via WhatsApp
                </button>
              </div>
            </div>

            {/* Description (Now BELOW Add to Cart / CTA Options) */}
            <div className="mb-8 border-y border-border/50 py-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">Product Description</h3>
              <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                {product.description || 'No description provided.'}
              </p>
            </div>

            {/* Trust Perks */}
            <div className="grid grid-cols-3 gap-2 border-t pt-6 text-center">
              <div className="flex flex-col items-center gap-1 p-2">
                <Truck className="w-4 h-4 text-foreground" />
                <span className="text-[10px] font-bold">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2">
                <ShieldCheck className="w-4 h-4 text-foreground" />
                <span className="text-[10px] font-bold">100% Certified</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2">
                <RefreshCw className="w-4 h-4 text-foreground" />
                <span className="text-[10px] font-bold">Easy Exchange</span>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t pt-12">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {uniqueImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white bg-white/20 p-3 rounded-full hover:bg-white/40 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white bg-white/20 p-3 rounded-full hover:bg-white/40 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <div className="max-w-4xl max-h-[85vh] relative flex items-center justify-center">
              <img
                src={uniqueImages[selectedImage]}
                alt={product.name}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}