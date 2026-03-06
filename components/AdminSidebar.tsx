"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const navSections = [
    { name: "Dashboard", path: "/admin" },
    {
        name: "Posts",
        path: "/admin/posts"
    },
    {
        name: "Events",
        path:"/admin/events"
    },
    {
        name: "Events-category",
        path: "/admin/events/create-category"
    },
    {
        name: "Media",
        path:"/admin/media"
    },
    {
        name: "Gallery",
        path: "/admin/gallery"
    },
    {
        name: "Navbar Menu",
        path: "/admin/menus"
    },
    {
        name: "Menu Items",
        path: "/admin/menu-items"
    },
    {
        name: "Site Settings",
        path: "/admin/site-settings"
    }
   
];

interface Props {
    userName?: string;
}

export default function AdminSidebarClient({ userName }: Props) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/auth/logout", {
                method: "POST"
            });
            const result = await res.json();
            if(!result.success){
                throw new Error("Couldn't Logout")
            }
            return true;
        },
        onSuccess: () => {
            toast.success("Logged out Successfully!!!");
            router.replace("/admin/login");
        },
        onError: (error) => {
            toast.error(error.message || "logout failed!!!")
        }
    })

    
    const isSectionActive = (children: { path: string }[]) => {
        return children.some(child => pathname === child.path);
    };

    return (
        <>
            {/* Mobile Navbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between z-50">
                <button
                    className="p-2 rounded-md hover:bg-gray-200 transition"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? (
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                <h2 className="text-lg font-semibold">
                    Welcome, {userName?.split(" ")[0]}
                </h2>

                {/* Empty div for flex spacing */}
                <div className="w-10"></div>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav
                className={`fixed inset-y-0 md:static top-0 left-0 w-64 bg-gray-100 p-6 flex flex-col z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:mt-0 mt-16`}
            >
                {/* Hidden on mobile since we have the mobile navbar */}
                <h2 className="hidden md:block text-lg sm:text-xl md:text-2xl font-bold mb-5 md:mb-8">
                    Welcome, {userName?.split(" ")[0]}
                </h2>

                <div className="flex flex-col space-y-2 text-sm sm:text-base">
                    {navSections.map((section) =>
                        <React.Fragment key={section.path}>
                            <Link
                                key={section.path}
                                href={section.path!}
                                onClick={() => setSidebarOpen(false)}
                                className={`block px-4 py-3 rounded-lg transition-all duration-200 ${pathname === section.path
                                        ? "bg-primary-500 text-black shadow-sm"
                                        : "text-secondary-700 hover:bg-primary-50 hover:text-primary-600"
                                    }`}
                            >
                                {section.name}
                            </Link>
                        </React.Fragment>

                    )}
                </div>

                <div className="mt-auto flex flex-col space-y-3 text-sm">
                    <button
                        className="px-4 py-2 rounded-lg border border-gray-400 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                    >
                        {logoutMutation.isPending ? "Logging out..." : "Logout"}
                    </button>


                </div>
            </nav>
        </>
    );
}