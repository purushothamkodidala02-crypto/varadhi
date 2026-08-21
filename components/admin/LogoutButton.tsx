"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-busy={loading}
      className="rounded-lg border px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
    >
      <PendingButtonContent pending={loading} pendingLabel="Logging out…">Logout</PendingButtonContent>
    </button>
  );
}
