import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart, getCartSubtotal } from '../hooks/useCart';

export function Cart() {
  const { items, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const subtotal = getCartSubtotal(items);

  const totalMRP = items.reduce((acc, item) => {
    const selling = Number(item.selling_price || 0);
    const price = Number(item.price || 0);
    const mrp = Number(item.mrp || 0);
    const effectiveMRP = mrp > 0 ? mrp : (selling > 0 ? selling : price);
    return acc + (effectiveMRP * item.quantity);
  }, 0);
  
  const totalSavings = totalMRP > subtotal ? totalMRP - subtotal : 0;

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-16 min-h-[60vh] flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-serif font-medium mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            to="/shop"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-8 md:pt-24 md:pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-1 md:py-8">
        <div className="flex items-center justify-between mb-2 md:mb-8 border-b md:border-none pb-1.5 md:pb-0">
          <h1 className="text-lg md:text-5xl font-serif font-bold tracking-tight">Shopping Cart</h1>
          <span className="text-xs font-semibold text-muted-foreground">
            {items.reduce((acc, item) => acc + item.quantity, 0)} Item(s)
          </span>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-12">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3">
            <div className="border-t md:border-t-0 border-border">
              <AnimatePresence>
                {items.map((item) => {
                  const selling = Number(item.selling_price || 0);
                  const price = Number(item.price || 0);
                  const mrp = Number(item.mrp || 0);
                  const itemPrice = selling > 0 ? selling : (price > 0 ? price : mrp);
                  const itemMRP = mrp > 0 ? mrp : itemPrice;

                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-2.5 sm:gap-6 py-2 sm:py-6 border-b border-border items-center"
                    >
                      {/* Product Image */}
                      <Link to={`/product/${item.slug}`} className="w-12 sm:w-24 md:w-32 aspect-[3/4] rounded-md overflow-hidden bg-secondary shrink-0 block">
                        {item.thumbnail || (item.images && item.images.length > 0) ? (
                          <img 
                            src={item.thumbnail || (item.images ? item.images[0].image_url : '')} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No Image</div>
                        )}
                      </Link>
                      
                      {/* Details */}
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            {item.category && (
                               <span className="text-[9px] sm:text-xs font-semibold tracking-widest uppercase text-muted-foreground block truncate">
                                 {item.category.name}
                               </span>
                            )}
                            <Link to={`/product/${item.slug}`} className="hover:text-muted-foreground transition-colors">
                              <h3 className="font-medium text-xs sm:text-base md:text-lg line-clamp-1">{item.name}</h3>
                            </Link>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs sm:text-base block">₹{(itemPrice * item.quantity).toFixed(2)}</span>
                            {itemMRP > itemPrice && (
                              <span className="text-muted-foreground line-through text-[9px] sm:text-xs block">₹{(itemMRP * item.quantity).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 sm:mt-4">
                          <div className="flex items-center border border-border rounded-full h-6 sm:h-10 px-1 w-20 sm:w-28 shrink-0">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-4 h-4 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                            >
                              <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                            <span className="flex-1 text-center text-[11px] sm:text-sm font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-4 h-4 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                            >
                              <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-[10px] sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Order Summary Card (Visible & Compact on Mobile & Desktop) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-secondary/30 rounded-2xl p-3.5 sm:p-6 lg:sticky lg:top-32 border border-border/50 shadow-xs">
              <h3 className="text-sm sm:text-xl font-bold mb-2 sm:mb-6">Order Summary</h3>
              
              <div className="space-y-1.5 sm:space-y-4 mb-2 sm:mb-6 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total MRP</span>
                  <span>₹{totalMRP.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selling Price Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Total Discount Savings</span>
                    <span>-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
              </div>
              
              <div className="h-px bg-border my-2 sm:my-6" />
              
              <div className="flex justify-between items-end mb-3 sm:mb-8">
                <div>
                  <span className="font-bold text-xs sm:text-base block">Grand Total</span>
                  <span className="text-[9px] sm:text-xs text-muted-foreground">Inclusive of all taxes</span>
                </div>
                <span className="text-base sm:text-2xl font-bold text-foreground">₹{subtotal.toFixed(2)}</span>
              </div>
              
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-foreground text-background py-2.5 sm:py-4 rounded-full font-bold hover-elevate transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs sm:text-sm shadow-md"
              >
                Proceed to Checkout <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}