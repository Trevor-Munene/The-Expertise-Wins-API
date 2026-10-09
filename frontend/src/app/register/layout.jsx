import { createPageMetadata } from "../../lib/seo";

export const metadata = createPageMetadata({ title: "Create Account", description: "Create an Expertise Wins account to manage your sports tip memberships.", pathname: "/register", noindex: true });
export default function RegisterLayout({ children }) { return children; }
