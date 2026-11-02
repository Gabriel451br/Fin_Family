"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Plus,
  CalendarClock,
  PieChart,
  Tags,
  Users,
  Settings,
  MoreHorizontal,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { signOutAction } from "@/lib/actions/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transactions", label: "Lançar", icon: Plus },
  { href: "/fixed", label: "Fixos", icon: CalendarClock },
  { href: "/budgets", label: "Orçamento", icon: PieChart },
];

const MORE_NAV: NavItem[] = [
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/family", label: "Família", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const DESKTOP_NAV = [...MAIN_NAV, ...MORE_NAV];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_NAV.some((item) => isActive(pathname, item.href));

  const mobileLeft = [MAIN_NAV[0], MAIN_NAV[2]];
  const mobileRight = [MAIN_NAV[3]];

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-lg font-bold text-slate-900">Fin Family</p>
          <p className="truncate text-sm text-slate-500">{familyName}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {DESKTOP_NAV.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(pathname, item.href)} />
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Cabeçalho mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <p className="font-bold text-slate-900">Fin Family</p>
          <p className="max-w-[55%] truncate text-xs text-slate-500">{familyName}</p>
        </header>

        <main className="flex-1 px-4 py-6 pb-32 md:px-8 md:py-8 md:pb-8">{children}</main>

        {/* Barra inferior mobile */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Menu principal"
        >
          <div className="grid grid-cols-5 items-end px-1">
            {mobileLeft.map((item) => (
              <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}

            <Link
              href="/transactions"
              className="flex flex-col items-center gap-0.5 pb-2 text-[11px] font-medium text-slate-700"
              aria-label="Lançar receita ou despesa"
            >
              <span
                className={cn(
                  "-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2a78d6] text-white shadow-lg shadow-blue-600/30 ring-4 ring-white",
                  isActive(pathname, "/transactions") && "bg-[#1c5cab]",
                )}
              >
                <Plus className="h-7 w-7" strokeWidth={2.5} />
              </span>
              Lançar
            </Link>

            {mobileRight.map((item) => (
              <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                moreActive ? "text-blue-700" : "text-slate-500",
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              Mais
            </button>
          </div>
        </nav>
      </div>

      {/* "Mais" (mobile) */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Fechar menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="relative w-full rounded-t-2xl bg-white p-4 shadow-xl"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{memberName}</p>
                <p className="text-xs text-slate-500">{familyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1" onClick={() => setMoreOpen(false)}>
              {MORE_NAV.map((item) => (
                <SideLink key={item.href} item={item} active={isActive(pathname, item.href)} />
              ))}
            </div>
            <form action={signOutAction} className="mt-2 border-t border-slate-100 pt-2">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-blue-700" : "text-slate-500",
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
