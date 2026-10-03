// frontend/src/lib/seo.js
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://expertise-wins.com";

export function generateStructuredData({ type = "WebSite", title, description, url, image, datePublished }) {
  const baseUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  if (type === "Article") {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description: description,
      url: baseUrl,
      image: image || `${SITE_URL}/og-image.png`,
      datePublished: datePublished || "2026-09-01",
      author: {
        "@type": "Organization",
        name: "The Expertise Wins / PikkBetter",
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "The Expertise Wins",
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/favicon.ico`,
        },
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Expertise Wins",
    url: SITE_URL,
    description: "The Expertise Wins is a Kenyan-curated sports data pipeline with transparent Free, VIP, and MaxBet tip archives, normalized markets, and performance tracking.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/tips?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
