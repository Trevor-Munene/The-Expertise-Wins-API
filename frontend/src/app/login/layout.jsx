import { createPageMetadata } from "../../lib/seo";

export const metadata = createPageMetadata({ title: "Sign In", description: "Sign in to your Expertise Wins account.", pathname: "/login", noindex: true });
export default function LoginLayout({ children }) { return children; }
