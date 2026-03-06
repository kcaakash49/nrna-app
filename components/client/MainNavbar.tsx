"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = {
  id: string;
  label: string;
  href?: string | null;
  children?: NavItem[];
};

const ChevronDown = ({ className = "" }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" className={`opacity-80 ${className}`}>
    <path fill="currentColor" d="M7 10l5 5 5-5" />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
    <path fill="currentColor" d="M10 17l5-5-5-5" />
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-90">
    <path fill="currentColor" d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-90">
    <path
      fill="currentColor"
      d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3 1.41 1.42z"
    />
  </svg>
);

// ---------------- Desktop recursive hover ----------------
function SubMenuItemDesktop({ item }: { item: NavItem }) {
  const hasChildren = (item.children?.length ?? 0) > 0;

  return (
    <div className="relative">
      {/* Make the row a peer */}
      <Link
        href={item.href || "#"}
        className="
          peer
          flex items-center justify-between gap-6
          px-4 py-2
          text-[14px] font-medium
          text-white/95
          hover:bg-white/10
          whitespace-nowrap
        "
      >
        <span>{item.label}</span>
        {hasChildren ? <ChevronRight /> : null}
      </Link>

      {/* Flyout: opens ONLY when this row is hovered (peer) */}
      {hasChildren && (
        <div
          className="
            absolute left-full top-0
            hidden
            z-[9999]
            peer-hover:block
            hover:block
          "
        >
          <div className="-ml-px min-w-[260px] border border-white/10 bg-[#2b2a75] shadow-xl">
            {item.children!.map((child) => (
              <SubMenuItemDesktop key={child.id} item={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Mobile accordion ----------------
function MobileNode({
  item,
  level = 0,
  onNavigate,
}: {
  item: NavItem;
  level?: number;
  onNavigate: () => void;
}) {
  const hasChildren = (item.children?.length ?? 0) > 0;
  const [open, setOpen] = useState(false);
  const paddingLeft = 14 + level * 14;

  if (!hasChildren) {
    return (
      <Link
        href={item.href || "#"}
        onClick={onNavigate}
        className="block py-3 text-[15px] text-white/95 hover:bg-white/10"
        style={{ paddingLeft, paddingRight: 14 }}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center justify-between py-3 text-[15px] text-white/95 hover:bg-white/10"
        style={{ paddingLeft, paddingRight: 14 }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{item.label}</span>
        <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="border-l border-white/10">
          {item.children!.map((child) => (
            <MobileNode key={child.id} item={child} level={level + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MainNavbar({ menu }: { menu: NavItem[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full bg-[#2b2a75] text-white sticky top-0 z-20">
      <div className="mx-auto max-w-[1600px] px-4">
        {/* Top row: hamburger on mobile + desktop menu */}
        <div className="flex items-center justify-between">
          {/* Mobile button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center gap-2 py-4"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            <span className="text-[15px] font-semibold">Menu</span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {menu.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0;

              return (
                <div key={item.id} className="relative group/top">
                  <Link
                    href={item.href || "#"}
                    className="inline-flex items-center gap-2 px-3 py-4 text-[15px] font-semibold hover:bg-white/10"
                  >
                    {item.label}
                    {hasChildren ? <ChevronDown /> : null}
                  </Link>

                  {hasChildren && (
                    <div className="absolute left-0 top-full hidden group-hover/top:block z-[9999]">
                      <div className="min-w-[280px] border border-white/10 bg-[#2b2a75] shadow-xl">
                        {item.children!.map((child) => (
                          <SubMenuItemDesktop key={child.id} item={child} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 pb-2">
            {menu.map((item) => (
              <MobileNode
                key={item.id}
                item={item}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}