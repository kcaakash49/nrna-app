
import AdminSidebarClient from "@/components/AdminSidebar";
import { requireAdmin } from "@/lib/auth";
import React from "react";

export default async function AdminLayout({ children } : {children: React.ReactNode}) {
  await requireAdmin();
  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      <AdminSidebarClient userName="Aakash" />
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-auto pt-16 md:pt-0">
          {children}
        </main>
        <footer className="shrink-0 text-center border-t p-2">
          {/* <Footer /> */}
          <br></br>
          <span>&copy; 2026 StackHook Pvt. Ltd.</span>
          <span className="hidden sm:inline">|</span>
          <span>All Rights Reserved</span>
        </footer>
      </div>
    </div>
  );
}