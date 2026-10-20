"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  Repeat,
  Target,
  PiggyBank,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { signOutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/recurring", label: "Recorrentes", icon: Repeat },
  { href: "/budgets", label: "Orçamentos", icon: Target },
  { href: "/goals", label: "Metas", icon: PiggyBank },
  { href: "/family", label: "Família", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
];

// itens priorizados na barra inferior do mobile (os demais ficam no menu "Mais")
const MOBILE_PRIMARY = ["/dashboard", "/transactions", "/accounts", "/goals"];

export function AppShell({
  familyName,
  memberName,
  children,
}: {
  familyName: string;
  memberName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-lg font-bold text-slate-900">Fin Family</p>
          <p className="truncate text-sm text-slate-500">{familyName}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-2 text-sm text-slate-600">{memberName}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div>
            <p className="font-bold text-slate-900">Fin Family</p>
            <p className="text-xs text-slate-500">{familyName}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white md:hidden">
          {NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.href)).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-blue-600" : "text-slate-500",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Menu mobile fullscreen */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex bg-black/40 md:hidden">
          <div className="flex w-72 flex-col bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-slate-900">Menu</p>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <NavLink item={item} active={isActive(pathname, item.href)} />
                </div>
              ))}
            </nav>
            <div className="border-t border-slate-200 pt-3">
              <p className="truncate px-2 text-sm text-slate-600">{memberName}</p>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </form>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </div>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: React.ElementType };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
