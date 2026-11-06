import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { storeSettingsService } from '@/services/storeSettingsService';
import { InstagramIcon, WhatsAppIcon, PhoneCallIcon, MailEnvelopeIcon } from '@/components/ui/BrandIcons';

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  const siteName = settings?.site_name || 'SNAPGEM';
  const cleanWaNumber = (settings?.whatsapp_number || '918669210030').replace(/[^0-9]/g, '');
  const cleanPhoneNumber = (settings?.contact_number || '+918669210030').replace(/[^0-9+]/g, '');
  const supportEmail = settings?.contact_email || 'support@snapgem.com';
  const instagramUrl = settings?.instagram_url || 'https://instagram.com';

  return (
    <footer className="bg-background pt-12 pb-6 border-t border-border/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Short Description */}
          <div className="lg:col-span-1 flex flex-col items-start space-y-3">
            <Link to="/" className="text-2xl font-bold tracking-tight font-sans text-foreground">
              {siteName.toUpperCase()}
            </Link>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Curated luxury fine jewelry and accessories. Handcrafted designs with direct WhatsApp order fulfillment.
            </p>

            {/* Quick Contact Badges */}
            <div className="pt-2 flex flex-col gap-2 text-xs text-muted-foreground">
              <a href={`tel:${cleanPhoneNumber}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <PhoneCallIcon className="w-3.5 h-3.5 text-primary shrink-0" /> {settings?.contact_number || '+91 8669210030'}
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <MailEnvelopeIcon className="w-3.5 h-3.5 text-primary shrink-0" /> {supportEmail}
              </a>
            </div>
          </div>

          {/* Quick Shop Links */}
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-foreground">Shop Collections</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
              <li><Link to="/shop" className="hover:text-foreground transition-colors">Shop All Products</Link></li>
              <li><Link to="/shop?sort=newest" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop?sort=price_high" className="hover:text-foreground transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-foreground">Customer Support</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
              <li><Link to="/page/contact" className="hover:text-foreground transition-colors flex items-center gap-1.5">Contact Us Page</Link></li>
              <li><Link to="/page/about-us" className="hover:text-foreground transition-colors">About {siteName}</Link></li>
              <li>
                <a href={`https://wa.me/${cleanWaNumber}`} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity text-green-600 font-bold inline-flex items-center gap-1.5">
                  <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp VIP Care
                </a>
              </li>
            </ul>
          </div>

          {/* Store Policy & Social Brand Icons */}
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-foreground">Connect With Us</h4>
            <div className="flex items-center gap-3 mb-6">
              <a 
                href={instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-secondary hover:bg-pink-600 hover:text-white flex items-center justify-center transition-all shadow-xs"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a 
                href={`mailto:${supportEmail}`}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all shadow-xs"
                title="Email Support"
              >
                <MailEnvelopeIcon className="w-4 h-4" />
              </a>
              <a 
                href={`tel:${cleanPhoneNumber}`}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-xs"
                title="Call Phone"
              >
                <PhoneCallIcon className="w-4 h-4" />
              </a>
              <a 
                href={`https://wa.me/${cleanWaNumber}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-secondary hover:bg-green-600 hover:text-white flex items-center justify-center transition-all shadow-xs"
                title="WhatsApp Support"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>

            <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
              <li><Link to="/page/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/page/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border/50 text-[11px] text-muted-foreground">
          <p>{settings?.footer_text || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}</p>
          <div className="flex items-center gap-3 mt-2 sm:mt-0 font-medium">
            <span>Currency: INR (₹)</span>
            <span>|</span>
            <span>Region: India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
