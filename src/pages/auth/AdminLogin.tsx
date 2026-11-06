import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { authService } from "@/services/authService";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshProfile, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && isAdmin) {
      console.log('Current Route:', location.pathname);
      console.log('Redirect Target:', '/admin/dashboard');
      console.log('[AdminLogin] Already authenticated as admin, navigating to /admin/dashboard');
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, isAdmin, navigate, location.pathname]);

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof adminLoginSchema>) {
    setIsSubmitting(true);
    console.log('[AdminLogin] Starting login submission for:', values.email);
    console.log('Current Route:', location.pathname);

    try {
      // 1. Perform login via Supabase Auth
      const signInResult = await authService.signIn(values.email, values.password);
      const userId = signInResult?.session?.user?.id;

      if (!userId) {
        throw new Error('Authentication succeeded but user ID is missing.');
      }

      console.log('Current User ID:', userId);

      // 2. Explicitly fetch profile from admin_users to prevent race conditions
      const userProfile = await refreshProfile(userId);
      const fetchedRole = userProfile?.role || 'customer';

      console.log('Fetched Role:', fetchedRole);
      console.log('isAdmin:', fetchedRole === 'admin');

      // 3. Evaluate role and navigate accordingly
      if (fetchedRole === 'admin') {
        console.log('Redirect Target:', '/admin/dashboard');
        toast.success("Admin authorization successful.");
        navigate("/admin/dashboard", { replace: true });
      } else {
        console.log('Redirect Target:', '/admin/access-denied');
        toast.error("Access Denied: Account lacks admin permissions.");
        navigate("/admin/access-denied", { replace: true });
      }
    } catch (error: any) {
      console.error('[AdminLogin] Submission error:', error);
      console.log('Redirect Target: NONE (Login Failed)');
      toast.error(error.message || "Invalid admin credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 p-10 border border-neutral-800 rounded-3xl bg-neutral-900/50 backdrop-blur-md shadow-2xl"
      >
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
             <ShieldAlert className="w-8 h-8 text-neutral-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Admin Portal</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Secure admin authentication.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Admin Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="admin@example.com" 
                      {...field} 
                      className="h-12 bg-neutral-950 border-neutral-800 focus-visible:ring-1 focus-visible:ring-white rounded-xl text-white placeholder:text-neutral-600" 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Password</FormLabel>
                  </div>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      className="h-12 bg-neutral-950 border-neutral-800 focus-visible:ring-1 focus-visible:ring-white rounded-xl text-white placeholder:text-neutral-600" 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-sm font-medium tracking-wide bg-white text-black hover:bg-neutral-200 transition-colors" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authorizing..." : "Authorize"}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
