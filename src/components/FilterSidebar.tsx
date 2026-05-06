"use client";

import { Brand, ProductType } from "@/types";
import FilterContent from "./FilterContent";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  types: ProductType[];
}

export default function FilterSidebar({
  isOpen,
  onClose,
  brands,
  types,
}: FilterSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? "translate-x-0" : "sidebar-hidden"} pt-20 lg:pt-4 lg:hidden`}
      >
        <div className="relative p-4 h-full overflow-y-auto">
          <FilterContent
            brands={brands}
            types={types}
            onApply={onClose}
            onClose={onClose}
          />
        </div>
      </aside>
    </>
  );
}
