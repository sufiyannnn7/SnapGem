import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

export const Layout = ({ children }: { children: ReactNode }) => {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <motion.main 
        key={location}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
};
