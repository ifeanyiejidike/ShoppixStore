"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormSchema, type ProductFormInput } from "@/lib/schema";
import { catalogApi } from "@/lib/api/catalog";
import type { Category, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const NO_CATEGORY_VALUE = "__none__";

export default function ProductForm({
  product,
  onSubmit,
  submitting,
}: {
  product?: Product;
  onSubmit: (data: ProductFormSchema) => void;
  submitting?: boolean;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    catalogApi
      .listCategories()
      .then(({ data }) => setCategories(data.results))
      .catch(() => setCategories([]));
  }, []);

  const form = useForm<ProductFormInput, unknown, ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      category_id: product?.category?.id || null,
      stock: product?.stock ?? 0,
      current_price: product ? Number(product.current_price) : 0,
      old_price: product?.old_price ? Number(product.old_price) : null,
      is_on_flash_sales: product?.is_on_flash_sales || false,
      flash_sale_ends_at: product?.flash_sale_ends_at || null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Portable Blender X200" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value || NO_CATEGORY_VALUE}
                onValueChange={(v) => field.onChange(v === NO_CATEGORY_VALUE ? null : v)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Uncategorized" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY_VALUE}>Uncategorized</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={(field.value as number | string) ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="current_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₦)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} value={(field.value as number | string) ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_on_flash_sales"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2.5 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-coral data-[state=checked]:border-coral"
                />
              </FormControl>
              <FormLabel className="font-normal">Put on flash sale</FormLabel>
            </FormItem>
          )}
        />

        {form.watch("is_on_flash_sales") && (
          <FormField
            control={form.control}
            name="old_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original price (₦) — shown struck through</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...field}
                    value={(field.value as number | string) ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="mt-2" disabled={submitting}>
          {submitting ? "Saving..." : product ? "Save changes" : "Create product"}
        </Button>
      </form>
    </Form>
  );
}
