import Link from "next/link";
import { ArrowLeft, Globe2, LayoutDashboard, ListChecks, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { Logo } from "@/components/ui";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/problems", label: "Problems", icon: ListChecks },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/worlds", label: "Worlds", icon: Globe2 },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Logo />
          <span className="chip border-coin/40 bg-coin/10 text-coin">ADMIN</span>
          <nav className="flex flex-1 gap-1 overflow-x-auto text-sm font-semibold">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-muted hover:bg-surface2 hover:text-ink">
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
          <Link href="/dashboard" className="btn-ghost px-3 py-1.5"><ArrowLeft size={14} /> App</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-5 lg:p-8">{children}</main>
    </div>
  );
}
