// frontend/src/app/robots.js
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://expertise-wins.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
