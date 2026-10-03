// frontend/src/app/sitemap.js
import { getAllPosts } from "../lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://expertise-wins.com";

export default function sitemap() {
  const posts = getAllPosts();

  const blogUrls = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date).toISOString(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const routes = [
    "",
    "/tips",
    "/archive",
    "/stats",
    "/products",
    "/blog",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === "/tips" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  return [...routes, ...blogUrls];
}
