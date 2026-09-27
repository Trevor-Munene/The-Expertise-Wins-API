// frontend/src/lib/blog.js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Ensure blog directory exists */
function getBlogDirectory() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }
  return BLOG_DIR;
}

/** Get all blog posts sorted by date */
export function getAllPosts() {
  const dir = getBlogDirectory();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const posts = files.map((fileName) => {
    const slug = fileName.replace(/\.mdx?$/, "");
    const fullPath = path.join(dir, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || slug.replace(/-/g, " "),
      date: data.date || "2026-09-01",
      author: data.author || "PikkBetter Team",
      category: data.category || "General",
      excerpt: data.excerpt || content.slice(0, 150) + "...",
      readTime: data.readTime || "4 min read",
      tags: data.tags || [],
      content,
    };
  });

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** Get single post by slug */
export function getPostBySlug(slug) {
  const dir = getBlogDirectory();
  const mdPath = path.join(dir, `${slug}.md`);
  const mdxPath = path.join(dir, `${slug}.mdx`);

  let targetPath = null;
  if (fs.existsSync(mdPath)) targetPath = mdPath;
  else if (fs.existsSync(mdxPath)) targetPath = mdxPath;

  if (!targetPath) return null;

  const fileContents = fs.readFileSync(targetPath, "utf8");
  const { data, content } = matter(fileContents);
  const htmlContent = marked.parse(content);

  return {
    slug,
    title: data.title || slug.replace(/-/g, " "),
    date: data.date || "2026-09-01",
    author: data.author || "PikkBetter Team",
    category: data.category || "General",
    excerpt: data.excerpt || "",
    readTime: data.readTime || "4 min read",
    tags: data.tags || [],
    content,
    htmlContent,
  };
}
