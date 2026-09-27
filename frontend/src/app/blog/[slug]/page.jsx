// frontend/src/app/blog/[slug]/page.jsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "../../../lib/blog";
import { formatDate } from "../../../lib/utils";
import { ArrowLeft, Calendar, Clock, User, Share2, Sparkles, Send } from "lucide-react";
import { generateStructuredData } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} — The Expertise Wins Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const jsonLd = generateStructuredData({
    type: "Article",
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    datePublished: post.date,
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Insights Blog</span>
      </Link>

      {/* Post Header */}
      <div className="space-y-4 pb-8 border-b border-dark-border">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-extrabold uppercase tracking-wider">
            {post.category}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDate(post.date)}</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <div className="w-8 h-8 rounded-full brand-avatar-badge flex items-center justify-center text-slate-950 font-bold">
              P
            </div>
            <span>Written by {post.author}</span>
          </div>
        </div>
      </div>

      {/* Post Body */}
      <div
        className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4
          prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
          prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-cyan-300 prose-code:bg-dark-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-dark-card prose-pre:border prose-pre:border-dark-border"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-dark-card to-dark-bg border border-cyan-500/30 rounded-2xl p-8 space-y-4 text-center mt-12 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-100">Ready to put these strategies to work?</h3>
        <p className="text-slate-300 text-xs max-w-lg mx-auto">
          Get daily curated picks, verified ROI tracking, and direct VIP additions directly in our official channels.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="px-5 py-2.5 bg-cyan-gradient text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 shadow-md"
          >
            Explore VIP Memberships
          </Link>
          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-xs rounded-xl hover:bg-sky-500/20"
          >
            Contact @PIKKBETTER on Telegram
          </a>
        </div>
      </div>
    </article>
  );
}
