export function getTipsPathForProduct(slug) {
  const value = String(slug || "").toLowerCase().replace(/[^a-z]/g, "");
  if (value.includes("maxbet")) return "/tips?tab=maxbet";
  if (value.includes("vip")) return "/tips?tab=vip";
  return "/tips?tab=free";
}

export function getPreferredTipsTab(response) {
  const products = response?.access ?? response?.products ?? response?.data ?? [];
  if (!Array.isArray(products)) return "free";

  const slugs = products.map((product) =>
    String(product?.slug || "").toLowerCase().replace(/[^a-z]/g, "")
  );
  if (slugs.some((slug) => slug.includes("vip") && !slug.includes("maxbet"))) return "vip";
  if (slugs.some((slug) => slug.includes("maxbet"))) return "maxbet";
  return "free";
}
