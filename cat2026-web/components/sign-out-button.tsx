"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="border border-green-700 px-3 py-2 text-xs uppercase hover:border-green-400"
    >
      Sign Out
    </button>
  );
}
