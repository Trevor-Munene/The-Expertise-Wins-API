import AdminLayout from "./AdminLayout";
import { createPageMetadata } from "../../lib/seo";

export const metadata = createPageMetadata({ title: "Administration", description: "Manage The Expertise Wins application.", pathname: "/admin", noindex: true });

export default function AdminRouteLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
