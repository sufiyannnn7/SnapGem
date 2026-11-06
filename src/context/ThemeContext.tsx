import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeSettingsService, StoreSettings } from '../services/storeSettingsService';

interface ThemeContextType {
  settings: StoreSettings | null;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ settings: null, isLoading: true });

// Helper to convert HEX to HSL for Tailwind CSS variables
function hexToHSL(hex: string): string {
  // Remove '#' if present
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Tailwind HSL format usually expects degrees and percentages: '222.2 47.4% 11.2%'
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['store_settings'],
    queryFn: storeSettingsService.getSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;

      if (settings.primary_color) {
        root.style.setProperty('--primary', hexToHSL(settings.primary_color));
      }
      if (settings.secondary_color) {
        root.style.setProperty('--secondary', hexToHSL(settings.secondary_color));
      }
      if (settings.accent_color) {
        root.style.setProperty('--accent', hexToHSL(settings.accent_color));
      }
      
      if (settings.site_name) {
        document.title = settings.site_name;
      }
      
      const faviconUrl = settings.favicon_url || '/favicon.png';
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = faviconUrl;
    }
  }, [settings]);

  // Handle Maintenance Mode
  if (settings?.maintenance_mode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground text-center p-4">
        <div>
          <h1 className="text-4xl font-serif mb-4">We'll be right back</h1>
          <p className="text-muted-foreground">{settings.site_name || 'Our store'} is currently undergoing maintenance.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ settings: settings || null, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
