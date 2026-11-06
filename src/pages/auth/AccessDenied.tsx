import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export function AccessDenied() {
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();

  const handleSignOut = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6 p-8 border border-neutral-800 rounded-3xl bg-neutral-900/50 backdrop-blur-md shadow-2xl"
      >
        <div className="w-20 h-20 bg-red-950/50 border border-red-800/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">Access Denied</h1>
        
        <p className="text-neutral-400 text-sm leading-relaxed">
          Your account <span className="text-white font-medium">({user?.email || 'Authenticated User'})</span> does not have administrative privileges to access the control panel.
        </p>

        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-500">
          Current Role: <span className="text-neutral-300 font-mono capitalize">{profile?.role || 'customer'}</span>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/')} 
            className="w-full h-11 bg-white text-black hover:bg-neutral-200 rounded-xl font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Storefront
          </Button>

          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="w-full h-11 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out & Switch Account
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
