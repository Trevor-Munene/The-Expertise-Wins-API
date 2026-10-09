// frontend\src\app\blog\[slug]\page.jsx

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Send,
} from "lucide-react";

import { getPostBySlug, getAllPosts } from "../../../lib/blog";
import { formatDate } from "../../../lib/utils";
import { createPageMetadata, generateStructuredData } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {};
  }

  return {
    ...createPageMetadata({ title: post.title, description: post.excerpt, pathname: `/blog/${post.slug}`, keywords: post.tags, type: "article" }),
    openGraph: { ...createPageMetadata({ title: post.title, description: post.excerpt, pathname: `/blog/${post.slug}`, type: "article" }).openGraph, publishedTime: post.date, authors: [post.author] },
  };
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = generateStructuredData({
    type: "Article",
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    datePublished: post.date,
    author: post.author,
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      {/* Back Link */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="
            inline-flex items-center gap-2
            text-xs font-bold text-slate-400
            hover:text-emerald-400
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-emerald-500
            focus-visible:ring-offset-2
            focus-visible:ring-offset-slate-950
            rounded-sm
            transition-colors
          "
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Insights Blog</span>
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-5 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="
              px-3 py-1
              bg-emerald-500/10
              text-emerald-400
              border border-emerald-500/20
              rounded-full
              text-xs
              font-extrabold
              uppercase
              tracking-wider
            "
          >
            {post.category}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock
              className="w-4 h-4 text-emerald-400"
              aria-hidden="true"
            />
            <span>{post.readTime}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar
              className="w-4 h-4"
              aria-hidden="true"
            />
            <time dateTime={post.date}>
              {formatDate(post.date)}
            </time>
          </div>
        </div>

        <h1
          className="
            text-3xl
            sm:text-5xl
            font-black
            text-slate-100
            tracking-tight
            leading-tight
          "
        >
          {post.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold pt-1">
          <div
            className="
              w-8 h-8
              rounded-full
              bg-emerald-400/10
              border border-emerald-400/20
              flex items-center justify-center
              text-emerald-400
              font-bold
            "
            aria-hidden="true"
          >
            {(post.author || "T")[0].toUpperCase()}
          </div>

          <span>Written by {post.author}</span>
        </div>
      </header>

      {/* Markdown Article Content */}
      <div
        className="blog-content mt-10"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />

      {/* Article CTA */}
      <section
        className="
          mt-14
          bg-slate-900
          border border-emerald-500/30
          rounded-2xl
          p-8
          space-y-4
          text-center
          shadow-xl
        "
      >
        <h2 className="text-xl font-bold text-slate-100">
          Ready to put these strategies to work?
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
          Get daily curated picks and tracked performance through
          The Expertise Wins. Explore the available memberships or
          join the public Telegram channel.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="
              inline-flex items-center justify-center
              px-5 py-2.5
              bg-emerald-400
              text-slate-950
              font-bold
              text-xs
              rounded-xl
              hover:bg-emerald-300
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-400
              focus-visible:ring-offset-2
              focus-visible:ring-offset-slate-900
              transition-colors
              shadow-md
            "
          >
            Explore Memberships
          </Link>

          <a
            href="https://t.me/+D_jIXFB807E0NmRk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join The Expertise Wins Telegram channel"
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5
              bg-sky-500/10
              text-sky-400
              border border-sky-500/20
              font-bold
              text-xs
              rounded-xl
              hover:bg-sky-500/20
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-sky-500
              focus-visible:ring-offset-2
              focus-visible:ring-offset-slate-900
              transition-colors
            "
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            Join Telegram
          </a>
        </div>
      </section>
    </article>
  );
}
