import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MindMood" }] }),
  component: NotificationsPage,
});

type Notif = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
};

function NotificationsPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as Notif[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notif-unread"] });
  };

  const markAllRead = async () => {
    await (supabase as any).from("notifications").update({ read: true }).eq("read", false);
    refresh();
  };
  const remove = async (id: string) => {
    await (supabase as any).from("notifications").delete().eq("id", id);
    refresh();
  };
  const toggleRead = async (n: Notif) => {
    await (supabase as any).from("notifications").update({ read: !n.read }).eq("id", n.id);
    refresh();
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <AppShell title="Notifications">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="glass rounded-2xl p-5 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
            <Bell className="size-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold">Your feed</div>
            <div className="text-xs text-muted-foreground">
              {unread} unread of {items.length}
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-xs inline-flex items-center gap-2"
            >
              <CheckCheck className="size-4" /> Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
            You're all caught up.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`glass rounded-2xl p-4 flex gap-3 items-start ${
                  !n.read ? "ring-1 ring-primary/40" : ""
                }`}
              >
                <button
                  onClick={() => toggleRead(n)}
                  className={`mt-1 size-2.5 rounded-full shrink-0 ${
                    n.read ? "bg-muted-foreground/30" : "bg-primary glow-primary"
                  }`}
                  aria-label="Toggle read"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-1">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                    {n.type} · {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => remove(n.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}