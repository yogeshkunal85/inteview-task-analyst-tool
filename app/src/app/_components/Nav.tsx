import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          Quoting Tool
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/catalog" className="hover:underline">
            Catalog
          </Link>
          <Link href="/quotes/new" className="hover:underline">
            New quote
          </Link>
        </nav>
      </div>
    </header>
  );
}

