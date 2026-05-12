/**
 * Canonical shop categories (must match grocery.model enum + admin forms).
 * URL slugs are stable and human-readable for /category/[slug] routes.
 */
export const SHOP_CATEGORIES = [
  { slug: "fruits-vegetables", name: "Fruits & Vegetables" },
  { slug: "dairy-eggs", name: "Dairy & Eggs" },
  { slug: "rice-atta-grains", name: "Rice, Atta & Grains" },
  { slug: "snacks-biscuits", name: "Snacks & Biscuits" },
  { slug: "spices-masalas", name: "Spices & Masalas" },
  { slug: "beverages-drinks", name: "Beverages & Drinks" },
  { slug: "personal-care", name: "Personal Care" },
  { slug: "household-essentials", name: "Household Essentials" },
  { slug: "instant-packaged-food", name: "Instant & Packaged Food" },
  { slug: "baby-pet-care", name: "Baby & Pet Care" },
] as const;

export type ShopCategorySlug = (typeof SHOP_CATEGORIES)[number]["slug"];

export function getCategoryNameFromSlug(slug: string): string | undefined {
  return SHOP_CATEGORIES.find((c) => c.slug === slug)?.name;
}

export function getSlugForCategoryName(name: string): string | undefined {
  return SHOP_CATEGORIES.find((c) => c.name === name)?.slug;
}
