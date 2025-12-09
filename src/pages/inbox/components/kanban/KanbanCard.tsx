import type { KanbanEmailItem } from "@/lib/api";
import { Loader2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SnoozePopover } from "./SnoozePopover";

export function KanbanCard({
    item,
    onSnooze,
    isUpdating,
    isSummarizing,
}: {
    item: KanbanEmailItem;
    onSnooze: (untilIso: string) => void;
    isUpdating?: boolean;
    isSummarizing?: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.messageId,
        data: {
            status: item.status,
        },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="rounded-xl border bg-background p-3 shadow-sm"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-1">
                    {/* Drag handle chuẩn: dùng setActivatorNodeRef */}
                    <span
                        ref={setActivatorNodeRef}
                        className="mt-0.5 cursor-grab text-muted-foreground"
                        {...attributes}
                        {...listeners}
                        title="Drag"
                    >
                        <GripVertical className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">
                            {item.senderName ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.senderEmail}
                        </p>
                    </div>
                </div>

                {(isUpdating || isSummarizing) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            <p className="mt-2 text-sm font-medium line-clamp-2">
                {item.subject ?? "(No subject)"}
            </p>

            {/* Summary area */}
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
                            {isSummarizing ? "Generating summary..." : "Summary pending..."}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
                <SnoozePopover
                    disabled={isUpdating}
                    onConfirm={(untilIso) => onSnooze(untilIso)}
                />
            </div>
        </div>
    );
}
