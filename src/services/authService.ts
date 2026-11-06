import { supabase } from '../lib/supabase';

export const authService = {
  async signIn(email: string, password: string) {
    console.log('[authService] Attempting signInWithPassword for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('[authService] signInWithPassword error:', error);
      throw error;
    }
    console.log('[authService] signInWithPassword success, session user:', data.session?.user?.id);
    return data;
  },

  async signOut() {
    console.log('[authService] Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[authService] signOut error:', error);
      throw error;
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProfile(userId: string) {
    console.log('Current User ID:', userId);

    try {
      // 1. Query admin_users table for logged in user's UUID
      const { data: adminRow, error: fetchErr } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('[authService] admin_users query result:', { adminRow, fetchErr });

      if (adminRow) {
        const fetchedRole = adminRow.role || 'admin';
        console.log('Fetched Role:', fetchedRole);
        console.log('isAdmin:', fetchedRole === 'admin');
        return { id: userId, role: fetchedRole as 'admin' | 'customer' };
      }

      // 2. Auto-provision first admin if admin_users is completely empty (0 rows)
      const { count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });

      if (count === 0 || count === null) {
        console.log('[authService] admin_users is empty, auto-inserting first admin user:', userId);
        const { data: newAdmin, error: insertErr } = await supabase
          .from('admin_users')
          .insert([{ id: userId, role: 'admin' }])
          .select()
          .maybeSingle();

        if (newAdmin || !insertErr || insertErr?.code === '23505') {
          console.log('Fetched Role: admin (auto-provisioned)');
          console.log('isAdmin: true');
          return { id: userId, role: 'admin' as const };
        }
      }
    } catch (err) {
      console.error('[authService] Exception while fetching admin profile:', err);
    }

    // Only if user is confirmed NOT in admin_users and table is populated
    console.log('Fetched Role: customer');
    console.log('isAdmin: false');
    return { id: userId, role: 'customer' as const };
  },
};
