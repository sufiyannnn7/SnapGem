import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Lock, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart, getCartSubtotal } from '../hooks/useCart';
import { toast } from 'sonner';
import { orderService, formatOrderNumber, AddressData } from '@/services/orderService';
import { storeSettingsService } from '@/services/storeSettingsService';
import { useQuery } from '@tanstack/react-query';

export function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  
  const subtotal = getCartSubtotal(items);

  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressData>();
  
  const shipping = Number(settings?.base_shipping_charge || 0);
  const freeThreshold = settings?.free_shipping_threshold !== undefined ? Number(settings.free_shipping_threshold) : 1000;
  const isFreeShipping = subtotal >= freeThreshold;
  const finalShipping = isFreeShipping ? 0 : shipping;
  const total = subtotal + finalShipping;

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
        <h2 className="text-3xl font-serif font-medium mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/shop')} className="text-foreground underline font-medium">Return to Shop</button>
      </div>
    );
  }

  const generateWhatsAppMessage = (orderNumber: string, createdOrderTotal: number, addressData: AddressData) => {
    const storeName = settings?.site_name || 'SnapGem Store';
    
    let msg = `🛍️ *${storeName}*\n\n`;
    msg += `*Order Number:* #${orderNumber}\n\n`;
    msg += `I have placed an order through the ${storeName} website.\n\n`;
    
    msg += `*Customer:* ${addressData.full_name}\n`;
    msg += `*Phone:* ${addressData.phone}\n\n`;
    
    msg += `*Delivery Address:*\n`;
    msg += `${addressData.address_line_1}${addressData.address_line_2 ? ', ' + addressData.address_line_2 : ''}\n`;
    if (addressData.landmark) {
      msg += `Landmark: ${addressData.landmark}\n`;
    }
    msg += `${addressData.city}, ${addressData.state} - ${addressData.pincode}\n\n`;

    msg += `*Items:*\n`;
    items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name} × ${item.quantity}\n`;
    });
    
    msg += `\n*Website Order Total:* ₹${Number(createdOrderTotal || 0).toFixed(2)}\n\n`;

    if (addressData.notes) {
      msg += `*Order Notes:*\n${addressData.notes}\n\n`;
    }

    msg += `Please verify my order in the ${storeName} website/admin system and send me the payment QR.\n\n`;
    msg += `Thank you!`;
    
    return encodeURIComponent(msg);
  };

  const onSubmit = async (data: AddressData) => {
    try {
      // 1. Recalculate and save authoritative order directly in Supabase
      const createdOrder = await orderService.createOrder(
        items,
        subtotal,
        finalShipping,
        totalSavings,
        total,
        data
      );
      
      const orderNum = formatOrderNumber(createdOrder);
      const dbTotal = Number(createdOrder.total || total);

      // 2. Format WhatsApp URL with Order Number prominent
      const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || settings?.whatsapp_number || '918669210030';
      const cleanWaNumber = waNumber.replace(/[^0-9]/g, '');
      const waMessage = generateWhatsAppMessage(orderNum, dbTotal, data);
      const waUrl = `https://wa.me/${cleanWaNumber}?text=${waMessage}`;
      
      // 3. Open WhatsApp automatically for customer
      window.open(waUrl, '_blank');

      // 4. Clear local cart ONLY AFTER successful order creation in DB
      await clearCart();
      
      // 5. Navigate to order confirmation
      toast.success('Order recorded in database successfully!');
      navigate('/order-success', { 
        state: { 
          order: {
            order: createdOrder,
            addressData: data,
            items: [...items],
            total: dbTotal,
            totalMRP,
            totalSavings,
            waUrl
          }
        } 
      });
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast.error('Failed to place order: ' + (error.message || 'Server error'));
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <button 
          onClick={() => navigate('/cart')} 
          className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Cart
        </button>

        <h1 className="text-3xl md:text-4xl font-serif font-medium mb-12">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="lg:w-3/5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Shipping Address Section */}
              <section>
                <h2 className="text-xl font-medium mb-6">Delivery Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                    <input 
                      {...register('full_name', { required: 'Full name is required' })}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="e.g. Rahul Sharma"
                    />
                    {errors.full_name && <span className="text-red-500 text-xs mt-1">{errors.full_name.message}</span>}
                  </div>

                  {/* Mobile Number */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Mobile Number *</label>
                    <input 
                      {...register('phone', { 
                        required: 'Mobile number is required',
                        pattern: {
                          value: /^[0-9+\s-]{8,15}$/,
                          message: 'Please enter a valid phone number'
                        }
                      })}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone.message}</span>}
                  </div>

                  {/* Address Line 1 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Address *</label>
                    <input 
                      {...register('address_line_1', { required: 'Address is required' })}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="Flat / House No. / Building / Street"
                    />
                    {errors.address_line_1 && <span className="text-red-500 text-xs mt-1">{errors.address_line_1.message}</span>}
                  </div>

                  {/* Address Line 2 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Address Line 2 (Optional)</label>
                    <input 
                      {...register('address_line_2')}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="Area / Sector / Colony"
                    />
                  </div>

                  {/* Landmark */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Landmark (Optional)</label>
                    <input 
                      {...register('landmark')}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="e.g. Near Metro Station / Behind Mall"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City *</label>
                    <input 
                      {...register('city', { required: 'City is required' })}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="Mumbai"
                    />
                    {errors.city && <span className="text-red-500 text-xs mt-1">{errors.city.message}</span>}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">State *</label>
                    <input 
                      {...register('state', { required: 'State is required' })}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="Maharashtra"
                    />
                    {errors.state && <span className="text-red-500 text-xs mt-1">{errors.state.message}</span>}
                  </div>

                  {/* PIN Code */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">PIN Code *</label>
                    <input 
                      {...register('pincode', { required: 'PIN Code is required' })}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="400001"
                    />
                    {errors.pincode && <span className="text-red-500 text-xs mt-1">{errors.pincode.message}</span>}
                  </div>

                  {/* Order Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Order Notes (Optional)</label>
                    <textarea 
                      {...register('notes')}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground min-h-[100px]"
                      placeholder="Special instructions for delivery..."
                    />
                  </div>
                </div>
              </section>

              {/* Payment Security Notice */}
              <section>
                <h2 className="text-xl font-medium mb-6">Payment Method</h2>
                <div className="border border-green-600/30 rounded-xl p-6 bg-green-500/5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shrink-0 border border-green-500/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base text-foreground">Official Website Price Guarantee</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Clicking "Proceed to WhatsApp" calculates and locks your exact order totals directly in our database. Your official order number will be generated automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-foreground text-background py-4 rounded-full font-medium hover-elevate transition-all duration-300 disabled:opacity-50 text-base cursor-pointer shadow-md"
              >
                {isSubmitting ? 'Recording Order...' : 'Proceed to WhatsApp'}
              </button>
            </form>
          </div>

          {/* Order Summary Column */}
          <div className="lg:w-2/5">
            <div className="bg-secondary/30 rounded-2xl p-6 lg:sticky lg:top-32 border border-border">
              <h3 className="text-xl font-medium mb-6 flex items-center justify-between">
                Order Summary
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              </h3>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map(item => {
                  const selling = Number(item.selling_price || 0);
                  const price = Number(item.price || 0);
                  const mrp = Number(item.mrp || 0);
                  const itemPrice = selling > 0 ? selling : (price > 0 ? price : mrp);
                  const itemMRP = mrp > 0 ? mrp : itemPrice;

                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-background rounded-md overflow-hidden shrink-0 border">
                        <img src={item.thumbnail || ''} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm">
                        <h4 className="font-medium line-clamp-1">{item.name}</h4>
                        <p className="text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-bold block">₹{(itemPrice * item.quantity).toFixed(2)}</span>
                        {itemMRP > itemPrice && (
                          <span className="text-xs text-muted-foreground line-through block">₹{(itemMRP * item.quantity).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="h-px bg-border mb-6" />
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total MRP</span>
                  <span>₹{totalMRP.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selling Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount Savings</span>
                    <span>-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">{finalShipping === 0 ? 'FREE' : `₹${Number(finalShipping).toFixed(2)}`}</span>
                </div>
              </div>
              
              <div className="h-px bg-border mb-6" />
              
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="font-bold text-base block">Grand Total</span>
                  <span className="text-xs text-muted-foreground">Inclusive of all taxes</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{Number(total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}