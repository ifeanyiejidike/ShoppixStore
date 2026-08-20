"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface ProductFilterState {
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  flashSale: boolean;
  ordering: string;
}

export const DEFAULT_FILTERS: ProductFilterState = {
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  flashSale: false,
  ordering: "-created_at",
};

const ALL_CATEGORIES_VALUE = "__all__";

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "current_price", label: "Price: low to high" },
  { value: "-current_price", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

function FilterFields({
  filters,
  onChange,
  categories,
}: {
  filters: ProductFilterState;
  onChange: (next: Partial<ProductFilterState>) => void;
  categories: Category[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label htmlFor="filter-category" className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Category
        </Label>
        <Select
          value={filters.category || ALL_CATEGORIES_VALUE}
          onValueChange={(value) => onChange({ category: value === ALL_CATEGORIES_VALUE ? "" : value })}
        >
          <SelectTrigger id="filter-category" className="w-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Price range (₦)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={filters.inStock}
            onCheckedChange={(checked) => onChange({ inStock: checked === true })}
          />
          In stock only
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={filters.flashSale}
            onCheckedChange={(checked) => onChange({ flashSale: checked === true })}
            className="data-[state=checked]:bg-coral data-[state=checked]:border-coral"
          />
          Flash deals only
        </label>
      </div>

      <div>
        <Label htmlFor="filter-sort" className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Sort by
        </Label>
        <Select value={filters.ordering} onValueChange={(value) => onChange({ ordering: value })}>
          <SelectTrigger id="filter-sort" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
        <X className="h-3.5 w-3.5" />
        Clear filters
      </Button>
    </div>
  );
}

export default function ProductFilters({
  filters,
  onChange,
}: {
  filters: ProductFilterState;
  onChange: (next: Partial<ProductFilterState>) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    catalogApi
      .listCategories()
      .then(({ data }) => setCategories(data.results))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <h2 className="mb-4 font-display text-lg italic text-ink">Filters</h2>
        <FilterFields filters={filters} onChange={onChange} categories={categories} />
      </aside>

      {/* Mobile filter sheet */}
      <div className="mb-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-canvas p-4">
            <SheetHeader className="px-0">
              <SheetTitle className="font-display italic text-xl">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterFields filters={filters} onChange={onChange} categories={categories} />
            </div>
            <SheetClose asChild>
              <Button className="mt-6 w-full">Show results</Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
