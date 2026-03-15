"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/today";
  }

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-md border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Login
        </p>

        <h1 className="text-3xl font-bold mb-6">Sign in</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-green-700 bg-black px-4 py-3 text-green-300 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-green-700 bg-black px-4 py-3 text-green-300 outline-none"
            required
          />

          <button
            type="submit"
            className="w-full border border-green-500 px-4 py-3 text-sm uppercase tracking-[0.2em] hover:bg-green-500 hover:text-black transition"
          >
            Sign In
          </button>
        </form>

        {message ? (
          <p className="mt-4 text-sm text-green-300">{message}</p>
        ) : null}
      </div>
    </main>
  );
}