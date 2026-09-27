// frontend/src/app/blog/page.jsx
import Link from "next/link";
import { getAllPosts } from "../../lib/blog";
import { formatDate } from "../../lib/utils";
import { BookOpen, Calendar, Clock, ArrowRight, Tag, Sparkles } from "lucide-react";
import { generateStructuredData } from "../../lib/seo";

export const metadata = {
  title: "Insights Blog & Betting Strategy — The Expertise Wins",
  description: "Read technical breakdowns on betting strategies, odds normalization engines, value curation, and bankroll management.",
  keywords: ["betting strategy", "odds normalization", "value betting guide", "bankroll management", "sports analytics"],
};

export default function BlogPage() {
  const posts = getAllPosts();
  const jsonLd = generateStructuredData({ type: "WebSite", title: metadata.title, description: metadata.description, url: "/blog" });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Banner */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Technical Insights & Strategy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Betting Insights & Systems Blog
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Deep dives into quantitative curation, odds normalization, market variance, and long-term bankroll growth.
        </p>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="bg-dark-card border border-dark-border hover:border-cyan-500/40 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between group glow-box"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {post.category}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.readTime}</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{post.excerpt}</p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] text-slate-400 bg-dark-bg px-2 py-0.5 rounded border border-dark-border">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-dark-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(post.date)}</span>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Read Post</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
