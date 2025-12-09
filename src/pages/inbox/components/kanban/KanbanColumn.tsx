import type { KanbanEmailItem } from "@/lib/api";
import { KanbanCard } from "./KanbanCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { EmailStatus } from "./constants";

export function KanbanColumn({
    title,
    status,
    items,
    onMoveItem,
    onSnoozeItem,
    loadingMap,
    summarizingMap,
}: {
    title: string;
    status: EmailStatus;
    items: KanbanEmailItem[];
    onMoveItem: (messageId: string, status: EmailStatus) => void;
    onSnoozeItem: (messageId: string, untilIso: string) => void;
    loadingMap: Record<string, boolean>;
    summarizingMap: Record<string, boolean>;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <div
            ref={setNodeRef}
            className={`rounded-2xl border bg-card p-3 transition ${isOver ? "ring-1 ring-primary/40" : ""
                }`}
        >
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                    {items.length}
                </span>
            </div>

            {/* Thêm id để hỗ trợ multi-container rõ ràng hơn */}
            <SortableContext
                id={status}
                items={items.map((i) => i.messageId)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">
                    {items.map((it) => (
                        <KanbanCard
                            key={it.messageId}
                            item={it}
                            onSnooze={(until) => onSnoozeItem(it.messageId, until)}
                            isUpdating={!!loadingMap[it.messageId]}
                            isSummarizing={!!summarizingMap[it.messageId]}
                        />
                    ))}

                    {!items.length && (
                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                            No items
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
