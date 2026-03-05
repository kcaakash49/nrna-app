"use client";

import Link from "next/link";

export default function MainNavbar({ menu }: { menu: any[] }) {
  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">

        {menu.map((item) => (
          <div key={item.id} className="relative group">

            <Link
              href={item.href || "#"}
              className="text-sm font-medium hover:text-blue-600"
            >
              {item.label}
            </Link>

            {item.children.length > 0 && (
              <div className="absolute left-0 top-full hidden min-w-[200px] rounded-md border bg-white shadow-md group-hover:block">

                {item.children.map((child: any) => (
                  <Link
                    key={child.id}
                    href={child.href || "#"}
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {child.label}
                  </Link>
                ))}

              </div>
            )}
          </div>
        ))}

      </div>
    </nav>
  );
}