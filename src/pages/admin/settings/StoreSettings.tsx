import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { storeSettingsService, StoreSettings } from '@/services/storeSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { downloadCSV } from '@/utils/csvExportImport';

export function StoreSettingsPage() {
  const { settings, isLoading } = useTheme();
  const queryClient = useQueryClient();

  const form = useForm<StoreSettings & { gst_number?: string; store_timing?: string; enable_cod?: boolean; google_maps_url?: string }>({
    defaultValues: {
      site_name: 'SnapGem Store',
      contact_email: '',
      contact_number: '',
      whatsapp_number: '',
      business_address: '',
      logo_url: '',
      favicon_url: '',
      primary_color: '#000000',
      secondary_color: '#ffffff',
      accent_color: '#3b82f6',
      footer_text: '© 2026 SnapGem Store. All rights reserved.',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      youtube_url: '',
      google_maps_url: '',
      gst_number: '',
      store_timing: 'Mon-Sat: 10:00 AM - 8:00 PM',
      enable_cod: true,
      base_shipping_charge: 0,
      free_shipping_threshold: 1000,
      seo_title: 'SnapGem | Luxury Fine Jewelry',
      seo_description: 'Discover handcrafted luxury fine jewelry with direct WhatsApp ordering and express dispatch.',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
        gst_number: (settings as any).gst_number || '',
        store_timing: (settings as any).store_timing || 'Mon-Sat: 10:00 AM - 8:00 PM',
        enable_cod: (settings as any).enable_cod !== undefined ? (settings as any).enable_cod : true,
        google_maps_url: (settings as any).google_maps_url || ''
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: storeSettingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_settings'] });
      toast.success('Store settings saved successfully to Supabase!');
    },
    onError: (error: any) => {
      toast.error('Failed to update store settings: ' + error.message);
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleBackupSettings = () => {
    const currentValues = form.getValues();
    const jsonStr = JSON.stringify(currentValues, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snapgem_settings_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    toast.success('Store settings backed up to JSON!');
  };

  const handleRestoreSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        form.reset(parsed);
        toast.success('Settings restored! Click Save Settings to commit to Supabase.');
      } catch (err: any) {
        toast.error('Invalid settings JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetThemeColors = () => {
    form.setValue('primary_color', '#000000');
    form.setValue('secondary_color', '#ffffff');
    form.setValue('accent_color', '#3b82f6');
    toast.success('Theme colors reset to default black/white theme.');
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading store settings...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>
          <p className="text-muted-foreground mt-2">Manage logo, WhatsApp ordering number, GST, social links, and theme branding.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBackupSettings}>
            <Download className="w-4 h-4 mr-1.5" /> Backup Settings
          </Button>
          <input type="file" id="restore-settings-file" accept=".json" className="hidden" onChange={handleRestoreSettings} />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="restore-settings-file" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-1.5" /> Restore Settings
            </label>
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            {/* Scrollable Tabs Bar for Mobile (Fixes UI/UX text scrambling & overlap bug) */}
            <TabsList className="flex w-full overflow-x-auto hide-scrollbar justify-start md:grid md:grid-cols-6 h-auto p-1.5 gap-1.5 bg-secondary/80 rounded-2xl border border-border/60">
              <TabsTrigger value="general" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl">General & GST</TabsTrigger>
              <TabsTrigger value="branding" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl">Logo & SEO</TabsTrigger>
              <TabsTrigger value="about" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl">About Us CMS</TabsTrigger>
              <TabsTrigger value="shipping" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl">Shipping & Payments</TabsTrigger>
              <TabsTrigger value="social" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl">Social Links</TabsTrigger>
              <TabsTrigger value="theme" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl">Theme & Colors</TabsTrigger>
            </TabsList>
            
            {/* GENERAL & GST TAB */}
            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Store Identity & GST Details</CardTitle>
                  <CardDescription>Primary store name, WhatsApp number, store timing, and business address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="site_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-sm">Store Name / Brand Title *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="e.g. SV SHREY or SnapGem Store" className="h-11" />
                          </FormControl>
                          <FormDescription className="text-xs">
                            This name appears in your header logo, footer, browser title bar, customer invoices, and WhatsApp messages.
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="918669210030" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gst_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="27AAAAA0000A1Z5" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="store_timing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Timing</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Mon-Sat: 10:00 AM - 8:00 PM" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value || ''} placeholder="support@snapgem.com" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="+91 8669210030" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="business_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business & Delivery Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} placeholder="123 Luxury Way, Diamond District, Mumbai..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* STOREFRONT PERKS CARD */}
              <Card>
                <CardHeader>
                  <CardTitle>4 Storefront Perks & Trust Badges</CardTitle>
                  <CardDescription>Edit the titles and subtitles displayed at the bottom of the home page & storefront.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Perk 1 */}
                  <div className="p-3 border rounded-xl bg-secondary/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="perk1_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 1 Title</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="Express Shipping" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perk1_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 1 Subtitle</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="Free shipping across India" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Perk 2 */}
                  <div className="p-3 border rounded-xl bg-secondary/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="perk2_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 2 Title</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="100% Certified" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perk2_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 2 Subtitle</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="Authentic hallmark gold & diamonds" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Perk 3 */}
                  <div className="p-3 border rounded-xl bg-secondary/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="perk3_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 3 Title</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="WhatsApp Assistance" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perk3_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 3 Subtitle</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="Direct seller chat & sizing help" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Perk 4 */}
                  <div className="p-3 border rounded-xl bg-secondary/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="perk4_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 4 Title</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="Easy Returns" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perk4_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">Perk 4 Subtitle</FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} placeholder="Hassle-free replacement policy" className="h-10 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* BRANDING & SEO TAB */}
            <TabsContent value="branding" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo, Favicon & Meta SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Logo URL</FormLabel>
                        <div className="flex gap-3">
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="https://..." className="h-11" />
                          </FormControl>
                          <MediaPickerModal 
                            defaultBucket="logos"
                            onSelect={(url) => form.setValue('logo_url', url)} 
                            trigger={<Button type="button" variant="outline" className="h-11">Browse Logo</Button>}
                          />
                        </div>
                        {field.value && (
                          <div className="mt-2 p-3 border rounded-xl bg-secondary/30 inline-block">
                            <img src={field.value} alt="Logo Preview" className="h-12 object-contain" />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="favicon_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon Icon URL</FormLabel>
                        <div className="flex gap-3">
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="https://..." className="h-11" />
                          </FormControl>
                          <MediaPickerModal 
                            defaultBucket="logos"
                            onSelect={(url) => form.setValue('favicon_url', url)} 
                            trigger={<Button type="button" variant="outline" className="h-11">Browse Favicon</Button>}
                          />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website SEO Meta Title</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="SnapGem | Luxury Fine Jewelry" className="h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website SEO Meta Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} placeholder="Handcrafted fine jewelry..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABOUT US CMS TAB */}
            <TabsContent value="about" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About Us Page Content & Brand Story</CardTitle>
                  <CardDescription>Edit the headline, brand mission story, and perk feature cards displayed on the About Us page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="about_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-sm">About Section Subtitle / Tagline</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="OUR STORY & HERITAGE" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="about_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-sm">Main Headline / Title</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Handcrafted Fine Jewelry Built for Generations" className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="about_story"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-sm">Brand Story & Mission Text</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            rows={5}
                            placeholder="At SnapGem Store, we believe that fine jewelry is more than an accessory..."
                            className="text-sm leading-relaxed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">About Us Feature Cards (3 Cards)</h4>

                    <div className="p-4 border rounded-2xl bg-secondary/20 space-y-3">
                      <h5 className="font-bold text-xs">Feature Card 1</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="about_perk1_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Title</FormLabel>
                              <FormControl><Input {...field} value={field.value || ''} placeholder="100% Certified" className="h-10 text-xs" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="about_perk1_desc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl><Input {...field} value={field.value || ''} placeholder="Authentic hallmark certification..." className="h-10 text-xs" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="p-4 border rounded-2xl bg-secondary/20 space-y-3">
                      <h5 className="font-bold text-xs">Feature Card 2</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="about_perk2_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Title</FormLabel>
                              <FormControl><Input {...field} value={field.value || ''} placeholder="Master Craftsmanship" className="h-10 text-xs" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="about_perk2_desc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl><Input {...field} value={field.value || ''} placeholder="Artisanal gold & diamond settings..." className="h-10 text-xs" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="p-4 border rounded-2xl bg-secondary/20 space-y-3">
                      <h5 className="font-bold text-xs">Feature Card 3</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="about_perk3_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Title</FormLabel>
                              <FormControl><Input {...field} value={field.value || ''} placeholder="Personalized VIP Care" className="h-10 text-xs" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="about_perk3_desc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl><Input {...field} value={field.value || ''} placeholder="Direct WhatsApp consultation..." className="h-10 text-xs" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SHIPPING & PAYMENTS TAB */}
            <TabsContent value="shipping" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Charges & Payment Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="base_shipping_charge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Shipping Fee (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value || 0} className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="free_shipping_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Shipping Minimum Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value || 0} className="h-11" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="enable_cod"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-4">
                        <div>
                          <FormLabel className="font-bold text-sm">Cash On Delivery (COD)</FormLabel>
                          <FormDescription className="text-xs">Allow customers to request COD during WhatsApp confirmation.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SOCIAL LINKS TAB */}
            <TabsContent value="social" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media & Google Maps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagram_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="https://instagram.com/snapgem" className="h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="https://facebook.com/snapgem" className="h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtube_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube Channel Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="https://youtube.com/@snapgem" className="h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="google_maps_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Maps Location Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="https://maps.google.com/..." className="h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* THEME COLORS TAB */}
            <TabsContent value="theme" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Theme Colors & Copyright</CardTitle>
                    <CardDescription>Adjust colors or reset to default.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleResetThemeColors}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset Theme Colors
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input type="color" {...field} className="w-12 h-11 p-1 cursor-pointer" />
                              <Input type="text" {...field} className="flex-1 h-11" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input type="color" {...field} className="w-12 h-11 p-1 cursor-pointer" />
                              <Input type="text" {...field} className="flex-1 h-11" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accent_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input type="color" {...field} className="w-12 h-11 p-1 cursor-pointer" />
                              <Input type="text" {...field} className="flex-1 h-11" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="footer_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Copyright Text</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="© 2026 SnapGem Store. All rights reserved." className="h-11" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving Settings...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
