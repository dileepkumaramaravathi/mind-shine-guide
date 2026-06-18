import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Sparkles,
  MessageCircleHeart,
  Smile,
  BookHeart,
  LineChart,
  HeartPulse,
  UserRound,
  LogOut,
  Menu,
  X,
  Brain,
  Users,
  Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/detect", label: "Emotion AI", icon: Sparkles },
  { to: "/chat", label: "Companion", icon: MessageCircleHeart },
  { to: "/mood", label: "Mood", icon: Smile },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/wellness", label: "Wellness", icon: HeartPulse },
  { to: "/community", label: "Community", icon: Users },
  { to: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notif-unread"],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* sidebar — desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col p-4 border-r border-border/40">
        <SidebarInner pathname={pathname} signOut={signOut} unread={unread} />
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 h-full w-72 p-4 glass"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarInner pathname={pathname} signOut={signOut} unread={unread} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center gap-3 border-b border-border/40 backdrop-blur-xl bg-background/60">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          {title && <h1 className="text-lg font-display font-semibold">{title}</h1>}
          <div className="ml-auto">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg hover:bg-muted inline-flex items-center"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarInner({
  pathname,
  signOut,
  unread,
}: {
  pathname: string;
  signOut: () => void;
  unread: number;
}) {
  return (
    <>
      <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
          <Brain className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none text-gradient">MindMood</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Mental wellness AI
          </div>
        </div>
      </Link>
      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          const showBadge = "badge" in item && item.badge && unread > 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-primary/15 text-foreground glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={signOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition mt-2"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </>
  );
}