import { createPageMetadata } from "../../lib/seo";

export const metadata = createPageMetadata({ title: "Your Profile", description: "Manage your Expertise Wins account and memberships.", pathname: "/profile", noindex: true });
export default function ProfileLayout({ children }) { return children; }
