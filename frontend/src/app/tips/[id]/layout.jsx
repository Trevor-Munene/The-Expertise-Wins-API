import { createPageMetadata } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return createPageMetadata({ title: "Tip Details", description: "Review the selection, market, odds, and settlement details for this tip.", pathname: `/tips/${params.id}`, noindex: true });
}

export default function TipDetailsLayout({ children }) { return children; }
