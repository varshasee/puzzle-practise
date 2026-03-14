import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-green-700 bg-black text-green-400">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="text-sm uppercase tracking-[0.3em] text-green-500">
          CAT 2026
        </Link>

        <nav className="flex gap-4 text-sm">
          <Link href="/today" className="hover:text-green-300">
            Today
          </Link>
          <Link href="/progress" className="hover:text-green-300">
            Progress
          </Link>
          <Link href="/archive" className="hover:text-green-300">
            Archive
          </Link>
        </nav>
      </div>
    </header>
  );
}