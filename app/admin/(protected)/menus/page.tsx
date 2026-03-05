import {prisma} from "@/lib/prisma";
import Link from "next/link";

export default async function MenusPage() {
  const menus = await prisma.menu.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Menus</h1>
        <Link href="/admin/menus/new" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
          New Menu
        </Link>
      </div>

      <div className="rounded-2xl border bg-white">
        {menus.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No menus yet.</p>
        ) : (
          <ul className="divide-y">
            {menus.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{m.key}</div>
                </div>
                <span className={`text-xs ${m.isActive ? "text-green-600" : "text-gray-500"}`}>
                  {m.isActive ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}