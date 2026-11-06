import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import { storeSettingsService } from '@/services/storeSettingsService';
import { ChevronRight, ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, ShieldCheck, Sparkles, Send, ExternalLink } from 'lucide-react';
import { InstagramIcon, WhatsAppIcon, PhoneCallIcon, MailEnvelopeIcon } from '@/components/ui/BrandIcons';
import { toast } from 'sonner';

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings
  });

  const { data: page, isLoading } = useQuery({
    queryKey: ['public_cms_page', slug],
    queryFn: async () => {
      if (!slug) return null;
      const pages = await cmsService.getPages();
      return pages.find(p => p.slug === slug || p.slug === slug.toLowerCase()) || null;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return <div className="pt-32 pb-16 min-h-[60vh] text-center text-muted-foreground">Loading page content...</div>;
  }

  const normalizedSlug = (slug || '').toLowerCase();
  const cleanWaNumber = (settings?.whatsapp_number || '918669210030').replace(/[^0-9]/g, '');
  const cleanPhoneNumber = (settings?.contact_number || '+918669210030').replace(/[^0-9+]/g, '');
  const supportEmail = settings?.contact_email || 'support@snapgem.com';
  const rawInsta = settings?.instagram_url || '';
  const instaHandle = rawInsta 
    ? '@' + rawInsta.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/^@/, '').replace(/\/$/, '')
    : '@snapgem_official';
  const instagramUrl = rawInsta 
    ? (rawInsta.startsWith('http') ? rawInsta : `https://instagram.com/${rawInsta.replace(/^@/, '')}`)
    : 'https://instagram.com';

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !contactMessage) {
      toast.error('Please fill in all fields');
      return;
    }
    const text = encodeURIComponent(`Hi ${settings?.site_name || 'SnapGem'} Support!\n\nName: ${contactName}\nPhone: ${contactPhone}\nMessage: ${contactMessage}`);
    window.open(`https://wa.me/${cleanWaNumber}?text=${text}`, '_blank');
    toast.success('Opening WhatsApp to send your message directly...');
  };

  // Dedicated Rich Contact Us Page
  if (normalizedSlug === 'contact') {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Contact Us</span>
          </nav>

          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GET IN TOUCH</span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold">We'd Love to Hear From You</h1>
            <p className="text-sm text-muted-foreground">
              Have a question about our fine jewelry, custom orders, or shipping? Contact us via call, email, Instagram, or WhatsApp.
            </p>
          </div>

          {/* Responsive 4-Column Contact Touchpoints Bar (2-cols on mobile horizontal, 4-cols on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
            
            {/* Phone Call Card */}
            <div className="border rounded-2xl p-4 sm:p-5 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <PhoneCallIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Phone Call</span>
                  <h4 className="font-semibold text-xs sm:text-sm truncate">{settings?.contact_number || '+91 8669210030'}</h4>
                </div>
              </div>
              <a
                href={`tel:${cleanPhoneNumber}`}
                className="inline-flex items-center justify-center gap-1.5 bg-secondary hover:bg-foreground hover:text-background text-foreground font-bold text-xs py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all w-full text-center"
              >
                <PhoneCallIcon className="w-3.5 h-3.5" /> Call Now
              </a>
            </div>

            {/* Email Support Card */}
            <div className="border rounded-2xl p-4 sm:p-5 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <MailEnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Support Email</span>
                  <h4 className="font-semibold text-xs sm:text-sm truncate">{supportEmail}</h4>
                </div>
              </div>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-center gap-1.5 bg-secondary hover:bg-foreground hover:text-background text-foreground font-bold text-xs py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all w-full text-center"
              >
                <MailEnvelopeIcon className="w-3.5 h-3.5" /> Send Email
              </a>
            </div>

            {/* Instagram Card */}
            <div className="border rounded-2xl p-4 sm:p-5 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <InstagramIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Instagram</span>
                  <h4 className="font-semibold text-xs sm:text-sm truncate">{instaHandle}</h4>
                </div>
              </div>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all w-full text-center shadow-sm"
              >
                <InstagramIcon className="w-3.5 h-3.5" /> Follow Instagram
              </a>
            </div>

            {/* WhatsApp Card */}
            <div className="border rounded-2xl p-5 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">WhatsApp Chat</span>
                  <h4 className="font-semibold text-sm truncate">+{cleanWaNumber}</h4>
                </div>
              </div>
              <a
                href={`https://wa.me/${cleanWaNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all w-full text-center shadow-sm"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" /> Start Chat
              </a>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Store Timing & Address Details */}
            <div className="space-y-6">
              <div className="border rounded-2xl p-6 bg-card space-y-4 shadow-sm">
                <h3 className="text-lg font-serif font-bold">Store & Showroom Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Working Hours:</span>
                      <span className="font-semibold">{settings?.store_timing || 'Mon-Sat: 10:00 AM - 8:00 PM'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Physical Address:</span>
                      <span className="font-semibold leading-relaxed block">{settings?.business_address || 'Diamond District, Mumbai, Maharashtra, India'}</span>
                    </div>
                  </div>
                  {settings?.google_maps_url && (
                    <a 
                      href={settings.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline pt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Store Location on Google Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Direct WhatsApp Action Banner */}
              <div className="bg-green-600/10 border border-green-600/30 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-base">
                  <WhatsAppIcon className="w-5 h-5" /> VIP Direct Sizing & Customization Chat
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Have a specific ring size or custom gold/diamond requirement? Talk directly to our master craftsmen on WhatsApp.
                </p>
                <a
                  href={`https://wa.me/${cleanWaNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-6 py-3.5 rounded-full transition-colors w-full shadow-sm"
                >
                  <WhatsAppIcon className="w-4 h-4" /> Open VIP WhatsApp Chat
                </a>
              </div>
            </div>

            {/* Direct Message Form */}
            <div className="border rounded-2xl p-6 sm:p-8 bg-card shadow-sm space-y-4">
              <h3 className="text-xl font-serif font-bold">Send Us a Direct Inquiry</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Priya Sharma"
                    required
                    className="w-full h-11 border rounded-xl px-4 text-xs bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full h-11 border rounded-xl px-4 text-xs bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Inquiring about custom gold ring sizing..."
                    required
                    className="w-full border rounded-xl p-4 text-xs bg-background focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-foreground text-background font-bold text-xs py-3.5 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Dedicated Rich About Us Page
  if (normalizedSlug === 'about-us') {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl space-y-12">
          
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">About Us</span>
          </nav>

          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {settings?.about_subtitle || 'OUR STORY & HERITAGE'}
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
              {settings?.about_title || 'Handcrafted Fine Jewelry Built for Generations'}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {settings?.about_story || `At ${settings?.site_name || 'SnapGem Store'}, we believe that fine jewelry is more than an accessory—it is an heirloom of memory, milestone, and timeless elegance.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-2xl p-6 bg-card space-y-2 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-foreground" />
              <h3 className="font-bold text-base">{settings?.about_perk1_title || '100% Certified'}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{settings?.about_perk1_desc || 'Every piece comes with authentic hallmark certification and quality assurance.'}</p>
            </div>

            <div className="border rounded-2xl p-6 bg-card space-y-2 shadow-xs">
              <Sparkles className="w-8 h-8 text-foreground" />
              <h3 className="font-bold text-base">{settings?.about_perk2_title || 'Master Craftsmanship'}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{settings?.about_perk2_desc || 'Artisanal gold and diamond settings handcrafted by master jewelers.'}</p>
            </div>

            <div className="border rounded-2xl p-6 bg-card space-y-2 shadow-xs">
              <MessageSquare className="w-8 h-8 text-foreground" />
              <h3 className="font-bold text-base">{settings?.about_perk3_title || 'Personalized VIP Care'}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{settings?.about_perk3_desc || 'Direct WhatsApp consultation with our team for custom sizing and ordering.'}</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Dynamic CMS Page Fallback
  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl space-y-8">
        
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{page ? page.title : slug}</span>
        </nav>

        {page ? (
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-serif font-bold">{page.title}</h1>
            <div 
              className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: page.content_html || '<p>Page content coming soon.</p>' }}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-serif font-bold mb-4">Page Not Found</h2>
            <p className="text-muted-foreground mb-8">The requested page "{slug}" does not exist or has been moved.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider">
              Return Home
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
