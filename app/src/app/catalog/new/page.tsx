import Link from "next/link";
import { Nav } from "@/app/_components/Nav";
import { createProductAction } from "@/app/catalog/actions";

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">New product</h1>
          <Link href="/catalog" className="text-sm text-zinc-700 hover:underline">
            Back
          </Link>
        </div>

        <form action={createProductAction} className="mt-6 space-y-4 rounded-lg border bg-white p-6">
          <div>
            <label className="block text-sm font-medium">Product name</label>
            <input
              name="name"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Analytics Suite"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create
          </button>
        </form>
      </main>
    </div>
  );
}

