import { Button } from "@/components/ui/button";
import type { Mailbox } from "@/lib/api";

export function MailboxSidebar({
    mailboxes,
    isLoading,
    selectedId,
    onSelect,
    onCompose,
    title = "Mailboxes",
    showCompose = true,
}: {
    mailboxes: Mailbox[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCompose?: () => void;
    title?: string;
    showCompose?: boolean;
}) {
    return (
        <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </p>
                {showCompose && onCompose && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={onCompose}>
                        Compose
                    </Button>
                )}
            </div>

            <div className="max-h-[calc(100vh-220px)] overflow-auto">
                {isLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                ) : mailboxes.length ? (
                    <ul className="divide-y">
                        {mailboxes.map((mailbox) => (
                            <li key={mailbox.id}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${selectedId === mailbox.id
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-muted/50"
                                        }`}
                                    onClick={() => onSelect(mailbox.id)}
                                >
                                    <span>{mailbox.name}</span>
                                    {typeof mailbox.unread === "number" && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                                            {mailbox.unread}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">No mailboxes.</div>
                )}
            </div>
        </div>
    );
}
