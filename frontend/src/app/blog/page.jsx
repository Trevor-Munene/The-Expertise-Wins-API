// frontend/src/app/blog/page.jsx
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";

import { getAllPosts } from "../../lib/blog";
import { formatDate } from "../../lib/utils";
import { generateStructuredData } from "../../lib/seo";

export const metadata = {
  title: "Insights Blog & Betting Strategy — The Expertise Wins",
  description:
    "Read technical breakdowns on betting strategies, odds normalization, value curation, and bankroll management.",
  keywords: [
    "betting strategy",
    "odds normalization",
    "value betting guide",
    "bankroll management",
    "sports analytics",
  ],
};

const cardClassName =
  "bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between group";

export default function BlogPage() {
  const posts = getAllPosts();

  const jsonLd = generateStructuredData({
    type: "WebSite",
    title: metadata.title,
    description: metadata.description,
    url: "/blog",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      {/* Header */}
      <header className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>Technical Insights & Strategy</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Betting Insights & Systems Blog
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Deep dives into quantitative curation, odds normalization, market
          variance, and long-term bankroll growth.
        </p>
      </header>

      {/* Posts */}
      {posts.length > 0 ? (
        <section
          aria-labelledby="blog-posts-heading"
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Sparkles
              className="w-4 h-4 text-cyan-400"
              aria-hidden="true"
            />
            <h2
              id="blog-posts-heading"
              className="text-sm font-bold text-slate-300 uppercase tracking-wider"
            >
              Latest Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.slug} className={cardClassName}>
                <div className="space-y-4">
                  {/* Category + Read Time */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {post.category}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                      <Clock
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                      />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-sm"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  {/* Excerpt */}
                  <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    />
                    <time dateTime={post.date}>
                      {formatDate(post.date)}
                    </time>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-sm transition-colors"
                  >
                    <span>Read Post</span>
                    <ArrowRight
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <BookOpen
            className="w-8 h-8 mx-auto mb-3 text-slate-600"
            aria-hidden="true"
          />
          <h2 className="text-sm font-bold text-slate-200">
            No posts available yet
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            New technical insights will appear here as they are published.
          </p>
        </section>
      )}
    </div>
  );
}