import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, Plus, Save, Edit, Trash2, Copy, RefreshCw, 
  Smartphone, Monitor, Eye, Image as ImageIcon, Flame, Sparkles, 
  Mail, Code, Layers, Star, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cmsService, HomepageSection } from '@/services/cmsService';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { ImageDropzone } from '@/components/admin/ImageDropzone';

const sectionLabels: Record<HomepageSection['section_type'], string> = {
  hero: 'Hero Banner',
  featured_collections: 'Featured Collections',
  trending_products: 'Trending Products',
  flash_sale: 'Flash Sale Deals',
  new_arrivals: 'New Arrivals',
  testimonials: 'Testimonials Slider',
  newsletter: 'Newsletter Subscription',
  custom_html: 'Custom HTML Block',
};

const sectionIcons: Record<HomepageSection['section_type'], any> = {
  hero: ImageIcon,
  featured_collections: Layers,
  trending_products: Flame,
  flash_sale: Flame,
  new_arrivals: Sparkles,
  testimonials: Star,
  newsletter: Mail,
  custom_html: Code,
};

const defaultInitialSections: HomepageSection[] = [
  { 
    id: 'sec-hero-1', 
    section_type: 'hero', 
    display_order: 0, 
    is_enabled: true, 
    settings: { 
      title: 'Elevate Your Everyday', 
      subtitle: 'Luxury Fine Jewelry & Accessories', 
      button_text: 'Explore Collection', 
      button_link: '/shop', 
      bg_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80' 
    }, 
    updated_at: '' 
  },
  { 
    id: 'sec-cats-2', 
    section_type: 'featured_collections', 
    display_order: 1, 
    is_enabled: true, 
    settings: { title: 'Curated Categories', subtitle: 'Browse by Style' }, 
    updated_at: '' 
  },
  { 
    id: 'sec-trend-3', 
    section_type: 'trending_products', 
    display_order: 2, 
    is_enabled: true, 
    settings: { title: 'Trending Right Now', subtitle: 'Handpicked Favorites', mode: 'auto' }, 
    updated_at: '' 
  },
  { 
    id: 'sec-news-4', 
    section_type: 'newsletter', 
    display_order: 3, 
    is_enabled: true, 
    settings: { title: 'Subscribe to Our VIP List', subtitle: 'Receive exclusive early access to new releases.', placeholder: 'Enter your email address', button_text: 'Join VIP' }, 
    updated_at: '' 
  },
];

function SortableItem({ 
  id, 
  section, 
  onToggle, 
  onEdit, 
  onDuplicate,
  onRemove 
}: { 
  id: string, 
  section: HomepageSection, 
  onToggle: (id: string) => void,
  onEdit: (section: HomepageSection) => void,
  onDuplicate: (section: HomepageSection) => void,
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComp = sectionIcons[section.section_type] || Layers;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3.5 mb-2.5 bg-background border rounded-xl shadow-sm transition-all ${!section.is_enabled ? 'opacity-60 bg-secondary/30' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 border">
        <IconComp className="h-4 w-4 text-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{sectionLabels[section.section_type] || section.section_type}</p>
        <p className="text-xs text-muted-foreground truncate">{section.settings?.title || 'No Title Set'}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Switch 
          checked={section.is_enabled} 
          onCheckedChange={() => onToggle(id)} 
          title={section.is_enabled ? 'Visible on Storefront' : 'Hidden on Storefront'}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Section Settings" onClick={() => onEdit(section)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate Section" onClick={() => onDuplicate(section)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" title="Delete Section" onClick={() => onRemove(id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function HomepageBuilder() {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const hasInitializedRef = useRef(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});

  // Fetch sections from Supabase
  const { data: dbSections = [], isLoading, refetch } = useQuery({
    queryKey: ['admin_homepage_sections'],
    queryFn: cmsService.getHomepageSections
  });

  // Fetch Products & Categories for section pickers
  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin_picker_products'],
    queryFn: () => productService.getProducts()
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['admin_picker_categories'],
    queryFn: categoryService.getCategories
  });

  // FIX INFINITE RENDER LOOP: Initialize sections array ONCE when query resolves
  useEffect(() => {
    if (!hasInitializedRef.current) {
      if (dbSections.length > 0) {
        setSections(dbSections);
        hasInitializedRef.current = true;
      } else if (!isLoading) {
        setSections(defaultInitialSections);
        hasInitializedRef.current = true;
        setIsDirty(true);
      }
    }
  }, [dbSections, isLoading]);

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, idx) => ({ ...item, display_order: idx }));
      });
      setIsDirty(true);
    }
  };

  const handleToggle = (id: string) => {
    setSections(items => items.map(item => 
      item.id === id ? { ...item, is_enabled: !item.is_enabled } : item
    ));
    setIsDirty(true);
  };

  const handleDuplicate = (section: HomepageSection) => {
    const newSection: HomepageSection = {
      ...section,
      id: `sec-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      display_order: sections.length,
      settings: { ...section.settings, title: `${section.settings?.title || ''} (Copy)` }
    };
    setSections([...sections, newSection]);
    setIsDirty(true);
    toast.success(`Duplicated ${sectionLabels[section.section_type]}`);
  };

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to remove this section from homepage?')) {
      setSections(items => items.filter(item => item.id !== id));
      setIsDirty(true);
    }
  };

  const handleReloadFromDB = async () => {
    if (isDirty && !confirm('You have unsaved changes. Discard and reload from database?')) {
      return;
    }
    const { data } = await refetch();
    if (data && data.length > 0) {
      setSections(data);
    } else {
      setSections(defaultInitialSections);
    }
    setIsDirty(false);
    toast.success('Reloaded sections from database');
  };

  const saveMutation = useMutation({
    mutationFn: () => cmsService.saveHomepageSections(sections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_homepage_sections'] });
      queryClient.invalidateQueries({ queryKey: ['homepage_sections'] });
      toast.success('Homepage layout saved to Supabase!');
      setIsDirty(false);
    },
    onError: (e: any) => toast.error(`Failed to save: ${e.message}`)
  });

  const addSection = (type: HomepageSection['section_type']) => {
    const newSection: HomepageSection = {
      id: `sec-${type}-${Date.now()}`,
      section_type: type,
      display_order: sections.length,
      is_enabled: true,
      settings: {
        title: `New ${sectionLabels[type]}`,
        subtitle: 'Explore our latest collection'
      },
      updated_at: ''
    };
    setSections([...sections, newSection]);
    setIsDirty(true);
    openEditModal(newSection);
  };

  const openEditModal = (section: HomepageSection) => {
    setEditingSection(section);
    setEditFormData(JSON.parse(JSON.stringify(section.settings || {})));
    setIsEditModalOpen(true);
  };

  const saveEditModal = () => {
    if (editingSection) {
      setSections(items => items.map(item => 
        item.id === editingSection.id ? { ...item, settings: editFormData } : item
      ));
      setIsDirty(true);
      setIsEditModalOpen(false);
      toast.success('Section updated (unsaved changes pending)');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Homepage Theme Customizer</h2>
            {isDirty && (
              <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">Shopify-style drag & drop editor with live preview and custom section settings.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-secondary/50 p-1 rounded-lg border">
            <Button
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleReloadFromDB} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Reload
          </Button>

          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Left Control Panel + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sections List & Add Panel (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Active Sections ({sections.length})
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="text-xs">Drag handles to reorder sections. Toggle visibility or edit content.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading layout...</div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No sections added yet.</div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map((section) => (
                      <SortableItem 
                        key={section.id} 
                        id={section.id} 
                        section={section} 
                        onToggle={handleToggle}
                        onEdit={openEditModal}
                        onDuplicate={handleDuplicate}
                        onRemove={handleRemove}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Add Section Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Section</CardTitle>
              <CardDescription className="text-xs">Click any section block to append it to your storefront.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {(Object.entries(sectionLabels) as [HomepageSection['section_type'], string][]).map(([type, label]) => {
                const IconComp = sectionIcons[type] || Layers;
                return (
                  <Button 
                    key={type} 
                    variant="outline" 
                    className="h-auto py-3 px-3 flex flex-col items-center justify-center text-center gap-1.5 hover:border-primary hover:bg-secondary/50 transition-all text-xs"
                    onClick={() => addSection(type)}
                  >
                    <IconComp className="h-4 w-4 text-primary" />
                    <span>{label}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Storefront Preview (7 cols) */}
        <div className="lg:col-span-7 sticky top-24">
          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="py-3 px-4 bg-secondary/50 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="text-xs font-mono text-muted-foreground ml-2">Live Preview Canvas</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{viewMode} Mode</span>
            </CardHeader>
            <CardContent className="p-0 bg-background overflow-hidden">
              <div className={`mx-auto transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-[375px] border-x border-border shadow-2xl my-4 rounded-3xl overflow-hidden' : 'w-full'}`}>
                <div className="max-h-[750px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                  {sections.filter(s => s.is_enabled).map(section => (
                    <LiveSectionPreview key={section.id} section={section} products={allProducts} categories={allCategories} />
                  ))}
                  {sections.filter(s => s.is_enabled).length === 0 && (
                    <div className="p-12 text-center text-muted-foreground text-sm">
                      No active sections. Enable or add a section to view live preview.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Editor Modal for Section Settings */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit {editingSection ? sectionLabels[editingSection.section_type] : 'Section'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            
            {/* HERO BANNER EDITOR */}
            {editingSection?.section_type === 'hero' && (
              <>
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Main Headline Title *</Label>
                  <Input 
                    value={editFormData.title || ''} 
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} 
                    placeholder="Elevate Your Everyday" 
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Subheading / Subtitle</Label>
                  <Input 
                    value={editFormData.subtitle || ''} 
                    onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })} 
                    placeholder="LUXURY FINE JEWELRY & ACCESSORIES" 
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Hero Banner Background Image (Drag & Drop or Select)</Label>
                  <ImageDropzone 
                    bucket="banners"
                    multiple={false}
                    label="Drag & drop new hero banner background image or click to browse"
                    onUploadSuccess={(urls) => {
                      if (urls[0]) {
                        setEditFormData({ ...editFormData, bg_image: urls[0], image_url: urls[0] });
                      }
                    }}
                  />

                  <div className="flex gap-2 items-center pt-2">
                    <Input 
                      value={editFormData.bg_image || editFormData.image_url || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, bg_image: e.target.value, image_url: e.target.value })} 
                      placeholder="Or paste image URL (https://...)" 
                      className="h-11"
                    />
                    <MediaPickerModal 
                      defaultBucket="banners"
                      multiple={false}
                      onSelect={(url) => setEditFormData({ ...editFormData, bg_image: url, image_url: url })} 
                      trigger={<Button type="button" variant="outline" className="h-11 shrink-0">Browse Library</Button>}
                    />
                  </div>

                  {(editFormData.bg_image || editFormData.image_url) && (
                    <div className="relative h-36 w-full rounded-xl overflow-hidden border bg-secondary/30 mt-2">
                      <img 
                        src={editFormData.bg_image || editFormData.image_url} 
                        alt="Hero Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Call to Action Button Text</Label>
                    <Input 
                      value={editFormData.button_text || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, button_text: e.target.value })} 
                      placeholder="Explore Collection" 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Button Target Link</Label>
                    <Input 
                      value={editFormData.button_link || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, button_link: e.target.value })} 
                      placeholder="/shop" 
                      className="h-11"
                    />
                  </div>
                </div>
              </>
            )}

            {/* FEATURED COLLECTIONS EDITOR */}
            {editingSection?.section_type === 'featured_collections' && (
              <>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="Shop by Category" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={editFormData.subtitle || ''} onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })} placeholder="Curated Fine Jewelry" />
                </div>
                <div className="space-y-2">
                  <Label>Select Categories to Display</Label>
                  <div className="grid grid-cols-2 gap-2 border rounded-xl p-3 max-h-48 overflow-y-auto">
                    {allCategories.map(cat => {
                      const selectedCats: string[] = editFormData.selected_categories || [];
                      const isSelected = selectedCats.includes(cat.id);
                      return (
                        <label key={cat.id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-secondary cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const updated = e.target.checked 
                                ? [...selectedCats, cat.id] 
                                : selectedCats.filter(id => id !== cat.id);
                              setEditFormData({ ...editFormData, selected_categories: updated });
                            }}
                          />
                          <span className="font-medium truncate">{cat.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TRENDING PRODUCTS EDITOR */}
            {editingSection?.section_type === 'trending_products' && (
              <>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="Trending Now" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={editFormData.subtitle || ''} onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })} placeholder="Handpicked Favorites" />
                </div>
                <div className="space-y-2">
                  <Label>Product Selection Mode</Label>
                  <select 
                    className="w-full border rounded-lg p-2.5 bg-background text-sm"
                    value={editFormData.mode || 'auto'}
                    onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value })}
                  >
                    <option value="auto">Automatic (Fetch Trending / Featured Products)</option>
                    <option value="manual">Manual Product Selection</option>
                  </select>
                </div>
                {editFormData.mode === 'manual' && (
                  <div className="space-y-2">
                    <Label>Select Manual Products</Label>
                    <div className="grid grid-cols-2 gap-2 border rounded-xl p-3 max-h-48 overflow-y-auto">
                      {allProducts.map(prod => {
                        const selectedProds: string[] = editFormData.selected_products || [];
                        const isSelected = selectedProds.includes(prod.id);
                        return (
                          <label key={prod.id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-secondary cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const updated = e.target.checked 
                                  ? [...selectedProds, prod.id] 
                                  : selectedProds.filter(id => id !== prod.id);
                                setEditFormData({ ...editFormData, selected_products: updated });
                              }}
                            />
                            <span className="font-medium truncate">{prod.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* FLASH SALE EDITOR */}
            {editingSection?.section_type === 'flash_sale' && (
              <>
                <div className="space-y-2">
                  <Label>Flash Sale Title</Label>
                  <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="Limited Time Offer" />
                </div>
                <div className="space-y-2">
                  <Label>Countdown End Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={editFormData.countdown_date || ''} 
                    onChange={(e) => setEditFormData({ ...editFormData, countdown_date: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Image URL</Label>
                  <div className="flex gap-2">
                    <Input value={editFormData.banner_url || ''} onChange={(e) => setEditFormData({ ...editFormData, banner_url: e.target.value })} />
                    <MediaPickerModal 
                      defaultBucket="banners"
                      onSelect={(url) => setEditFormData({ ...editFormData, banner_url: url })} 
                      trigger={<Button type="button" variant="outline">Browse</Button>}
                    />
                  </div>
                </div>
              </>
            )}

            {/* NEW ARRIVALS EDITOR */}
            {editingSection?.section_type === 'new_arrivals' && (
              <>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="New Arrivals" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={editFormData.subtitle || ''} onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })} placeholder="Fresh Styles Just Landed" />
                </div>
              </>
            )}

            {/* TESTIMONIALS EDITOR */}
            {editingSection?.section_type === 'testimonials' && (
              <>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="Loved by Our Community" />
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold">Testimonials List</Label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const list = editFormData.list || [];
                        setEditFormData({ 
                          ...editFormData, 
                          list: [...list, { id: Date.now(), author: 'Jane Doe', role: 'Verified Buyer', quote: 'Absolutely superb quality!', rating: 5 }] 
                        });
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Review
                    </Button>
                  </div>

                  {(editFormData.list || []).map((t: any, idx: number) => (
                    <div key={t.id || idx} className="border p-3 rounded-xl space-y-2 bg-secondary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">Review #{idx + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500"
                          onClick={() => {
                            const updated = editFormData.list.filter((_: any, i: number) => i !== idx);
                            setEditFormData({ ...editFormData, list: updated });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Author Name" 
                          value={t.author || ''} 
                          onChange={(e) => {
                            const list = [...editFormData.list];
                            list[idx].author = e.target.value;
                            setEditFormData({ ...editFormData, list });
                          }} 
                        />
                        <Input 
                          placeholder="Role (e.g. VIP Customer)" 
                          value={t.role || ''} 
                          onChange={(e) => {
                            const list = [...editFormData.list];
                            list[idx].role = e.target.value;
                            setEditFormData({ ...editFormData, list });
                          }} 
                        />
                      </div>
                      <Textarea 
                        placeholder="Quote text..." 
                        value={t.quote || ''} 
                        onChange={(e) => {
                          const list = [...editFormData.list];
                          list[idx].quote = e.target.value;
                          setEditFormData({ ...editFormData, list });
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* NEWSLETTER EDITOR */}
            {editingSection?.section_type === 'newsletter' && (
              <>
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="Subscribe to Our Newsletter" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={editFormData.subtitle || ''} onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })} placeholder="Get 10% off your first luxury order." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Input Placeholder</Label>
                    <Input value={editFormData.placeholder || ''} onChange={(e) => setEditFormData({ ...editFormData, placeholder: e.target.value })} placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Submit Button Text</Label>
                    <Input value={editFormData.button_text || ''} onChange={(e) => setEditFormData({ ...editFormData, button_text: e.target.value })} placeholder="Subscribe" />
                  </div>
                </div>
              </>
            )}

            {/* CUSTOM HTML BLOCK EDITOR */}
            {editingSection?.section_type === 'custom_html' && (
              <div className="space-y-2">
                <Label>Custom Raw HTML / Embed Code</Label>
                <Textarea 
                  className="min-h-[200px] font-mono text-xs"
                  value={editFormData.html || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, html: e.target.value })} 
                  placeholder="<div class='custom-banner'>...</div>"
                />
              </div>
            )}

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEditModal}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Subcomponent: Real-time Live Section Preview Component
function LiveSectionPreview({ 
  section, 
  products, 
  categories 
}: { 
  section: HomepageSection, 
  products: any[], 
  categories: any[] 
}) {
  const { settings } = section;

  switch (section.section_type) {
    case 'hero':
      return (
        <div className="relative h-64 bg-slate-900 text-white flex items-center justify-center text-center p-6 overflow-hidden">
          {settings?.bg_image && (
            <img src={settings.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          <div className="relative z-10 space-y-2 max-w-md">
            <p className="text-xs uppercase tracking-widest text-slate-300 font-semibold">{settings?.subtitle || 'Spring Collection'}</p>
            <h2 className="text-2xl font-serif font-bold">{settings?.title || 'Elevate Your Everyday'}</h2>
            <button className="inline-block bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold mt-2">
              {settings?.button_text || 'Shop Now'}
            </button>
          </div>
        </div>
      );

    case 'featured_collections':
      return (
        <div className="p-6 text-center space-y-4">
          <h3 className="text-lg font-serif font-bold">{settings?.title || 'Shop by Category'}</h3>
          <div className="grid grid-cols-4 gap-2">
            {categories.slice(0, 4).map(c => (
              <div key={c.id} className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary mx-auto overflow-hidden border">
                  <img src={c.image_url || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-medium block truncate mt-1">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'trending_products':
    case 'new_arrivals':
      return (
        <div className="p-6 bg-secondary/20 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{settings?.subtitle || 'Curated'}</p>
              <h3 className="text-lg font-serif font-bold">{settings?.title || 'Trending Products'}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 2).map(p => (
              <div key={p.id} className="border rounded-xl p-2 bg-background text-left">
                <div className="aspect-square bg-secondary rounded-lg overflow-hidden mb-2">
                  <img src={p.thumbnail || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-bold truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">₹{p.selling_price}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div className="p-6 bg-black text-white text-center space-y-3">
          <h3 className="text-base font-serif font-bold">{settings?.title || 'Subscribe'}</h3>
          <p className="text-xs text-neutral-400">{settings?.subtitle || 'Get exclusive deals.'}</p>
          <div className="flex gap-2 max-w-xs mx-auto">
            <input className="bg-neutral-800 border-neutral-700 px-3 py-1 text-xs rounded flex-1" placeholder={settings?.placeholder || 'Email'} readOnly />
            <button className="bg-white text-black text-xs font-bold px-3 py-1 rounded">{settings?.button_text || 'Join'}</button>
          </div>
        </div>
      );

    case 'custom_html':
      return (
        <div className="p-4 border border-dashed font-mono text-xs text-muted-foreground bg-secondary/10">
          <div dangerouslySetInnerHTML={{ __html: settings?.html || '<p>[Custom HTML Block Preview]</p>' }} />
        </div>
      );

    default:
      return (
        <div className="p-4 text-center text-xs text-muted-foreground">
          [{sectionLabels[section.section_type] || section.section_type} Preview]
        </div>
      );
  }
}
