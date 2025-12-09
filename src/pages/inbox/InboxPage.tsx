import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMailboxes } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MailboxSidebar } from "./components/MailboxSidebar";
import { ModeToggle, type InboxMode } from "./components/mode-toggle";
import { TraditionalInboxView } from "./components/traditional/TraditionalInboxView";
import { KanbanInboxView } from "./components/kanban/KanbanInboxView";

export default function InboxPage() {
    const { user, logout } = useAuth();

    const [mode, setMode] = useState<InboxMode>("traditional");
    const [selectedMailbox, setSelectedMailbox] = useState<string | null>(null);

    const mailboxesQuery = useQuery({
        queryKey: ["mailboxes"],
        queryFn: getMailboxes,
    });

    // auto select first mailbox for traditional
    useEffect(() => {
        if (mode === "traditional") {
            if (!selectedMailbox && mailboxesQuery.data?.data.length) {
                setSelectedMailbox(mailboxesQuery.data.data[0].id);
            }
        }
    }, [mailboxesQuery.data, selectedMailbox, mode]);

    // when switching to kanban, force labelId = INBOX (không cần filter sidebar)
    useEffect(() => {
        if (mode === "kanban") {
            setSelectedMailbox("INBOX");
        }
    }, [mode]);

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <header className="border-b bg-card">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            Mailbox
                        </p>
                        <h1 className="text-2xl font-semibold">Inbox workspace</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle mode={mode} onChange={setMode} />
                        <div className="text-right">
                            <p className="text-sm font-medium">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">
                                {user?.provider ?? "password"} session
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => logout()}>
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto max-w-6xl p-4">
                    {mode === "traditional" ? (
                        <div className="grid gap-4 lg:grid-cols-[22%_78%]">
                            <MailboxSidebar
                                mailboxes={mailboxesQuery.data?.data ?? []}
                                isLoading={mailboxesQuery.isLoading}
                                selectedId={selectedMailbox}
                                onSelect={setSelectedMailbox}
                                title="Mailboxes"
                                showCompose={false}
                            />

                            <div className="rounded-xl border bg-card p-4">
                                {!selectedMailbox ? (
                                    <div className="text-sm text-muted-foreground">
                                        Select a mailbox…
                                    </div>
                                ) : (
                                    <TraditionalInboxView mailboxId={selectedMailbox} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-card p-4">
                            <KanbanInboxView labelId={selectedMailbox ?? "INBOX"} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
