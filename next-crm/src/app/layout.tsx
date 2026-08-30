import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "CoreDesk - Sales TNT",
  description: "CRM System for Sales TNT",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: authData } = await supabase.auth.getUser();
  let currentUser = null;
  
  if (authData?.user) {
    const { data } = await supabase.from('users').select('*').eq('auth_id', authData.user.id).single();
    if (data) {
      currentUser = data;
    } else {
      // Auto-register new user
      const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User Baru';
      const { data: newUser } = await supabase.from('users').insert({
        id: authData.user.id,
        auth_id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: 'pending',
      }).select().single();
      currentUser = newUser;
    }
  }

  if (currentUser?.role === 'pending') {
    const PendingScreen = (await import('@/components/PendingScreen')).default;
    return (
      <html lang="id">
        <body>
          <PendingScreen email={currentUser.email} name={currentUser.name} />
        </body>
      </html>
    );
  }

  return (
    <html lang="id">
      <body>
        <AppLayout user={currentUser}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
