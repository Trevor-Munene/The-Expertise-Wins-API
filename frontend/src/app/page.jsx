import HomePage from "./HomePage";
import { createPageMetadata, generateStructuredData } from "../lib/seo";

export const metadata = createPageMetadata({
  title: "Daily Sports Tips & Transparent Results",
  description: "Explore free sports tips, transparent archives, and performance statistics from The Expertise Wins.",
  pathname: "/",
});

export default function Home() {
  const jsonLd = generateStructuredData({ type: "WebSite", url: "/" });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage />
    </>
  );
}
