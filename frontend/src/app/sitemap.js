// frontend/src/app/sitemap.js
import { getAllPosts } from "../lib/blog";
import { SITE_URL } from "../lib/seo";

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
    "/about",
    "/bookies",
    "/coffee",
    "/responsible-betting",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === "/tips" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  return [...routes, ...blogUrls];
}
