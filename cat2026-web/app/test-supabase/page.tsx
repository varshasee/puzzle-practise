import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").limit(1);

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-4xl border border-green-500 p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
        <pre className="text-sm whitespace-pre-wrap">
          {JSON.stringify({ data, error }, null, 2)}
        </pre>
      </div>
    </main>
  );
}