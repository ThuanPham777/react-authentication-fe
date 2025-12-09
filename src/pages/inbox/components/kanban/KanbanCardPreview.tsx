import type { KanbanEmailItem } from "@/lib/api";

export function KanbanCardPreview({ item }: { item: KanbanEmailItem }) {
    return (
        <div className="rounded-xl border bg-background p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                        {item.senderName ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.senderEmail}
                    </p>
                </div>
            </div>

            <p className="mt-2 text-sm font-medium line-clamp-2">
                {item.subject ?? "(No subject)"}
            </p>

            <div className="mt-2">
                {item.summary ? (
                    <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            AI Summary
                        </p>
                        <p className="text-xs leading-relaxed">{item.summary}</p>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed p-2">
                        <p className="text-xs text-muted-foreground">
                            Summary pending...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
