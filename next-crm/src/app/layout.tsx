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
    currentUser = data;
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
