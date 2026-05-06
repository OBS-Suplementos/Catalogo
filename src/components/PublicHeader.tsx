"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/SearchBar";

import { Brand, ProductType } from "@/types";

const FilterSidebar = dynamic(() => import("@/components/FilterSidebar"), {
  ssr: false,
  loading: () => null,
});

interface PublicHeaderProps {
  showFilters?: boolean;
  brands?: Brand[];
  types?: ProductType[];
}

export default function PublicHeader({
  showFilters = true,
  brands = [],
  types = [],
}: PublicHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const canShowProductTools = pathname === "/";
  const canShowFilters = showFilters && canShowProductTools;

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container-custom">
          <div className="relative flex items-center justify-between h-16 gap-4">
            {/* Hamburger menu for filters (mobile) */}
            <div className="flex-shrink-0 w-10 lg:hidden">
              {canShowFilters && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-muted rounded-md"
                  aria-label="Abrir filtros"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              <div className="relative w-10 h-10 overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src="/images/logo.webp"
                  alt="Suplementos Logo"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <span className="font-bold text-xl hidden sm:inline">
                 | Catálogo
              </span>
            </Link>

            {/* Search bar - hidden on mobile */}
            {canShowProductTools ? (
              <div className="hidden lg:block lg:flex-1 lg:max-w-md mx-auto">
                <SearchBar />
              </div>
            ) : (
              <div className="hidden lg:block lg:flex-1" />
            )}

            {/* Public links */}
            <div className="flex flex-shrink-0 items-center justify-end gap-1 sm:gap-2">
              <Link
                href="/convenios"
                className="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium transition-colors hover:bg-muted"
                aria-label="Convenios"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                  <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
                  <path d="m21 3 1 11h-2" />
                  <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
                  <path d="M3 4h8" />
                </svg>
                <span>Convenios</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Sidebar */}
      {canShowFilters && sidebarOpen && (
        <FilterSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          brands={brands}
          types={types}
        />
      )}
    </>
  );
}
