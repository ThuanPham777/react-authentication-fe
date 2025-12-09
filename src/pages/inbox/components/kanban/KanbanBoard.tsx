import {
    DndContext,
    closestCorners,
    type DragEndEvent,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { KanbanBoardData, KanbanEmailItem } from "@/lib/api";
import { KanbanColumn } from "./KanbanColumn";
import {
    COLUMN_TITLES,
    DEFAULT_KANBAN_STATUSES,
    type EmailStatus,
} from "./constants";
import { KanbanCardPreview } from "./KanbanCardPreview";

function findItem(board: KanbanBoardData, messageId: string, statuses: EmailStatus[]) {
    for (const st of statuses) {
        const found = (board as any)[st]?.find((i: KanbanEmailItem) => i.messageId === messageId);
        if (found) return found;
    }
    return null;
}

function findStatusOf(board: KanbanBoardData, messageId: string, statuses: EmailStatus[]) {
    for (const st of statuses) {
        if ((board as any)[st]?.some((i: KanbanEmailItem) => i.messageId === messageId)) {
            return st;
        }
    }
    return null;
}

export function KanbanBoard({
    board,
    onMoveItem,
    onSnoozeItem,
    loadingMap,
    summarizingMap,
    statuses = DEFAULT_KANBAN_STATUSES,
}: {
    board: KanbanBoardData;
    onMoveItem: (messageId: string, status: EmailStatus) => void;
    onSnoozeItem: (messageId: string, untilIso: string) => void;
    loadingMap: Record<string, boolean>;
    summarizingMap: Record<string, boolean>;
    statuses?: EmailStatus[];
}) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns = useMemo(
        () =>
            statuses.map((st) => ({
                status: st,
                title: COLUMN_TITLES[st],
                items: (board as any)[st] ?? [],
            })),
        [board, statuses]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeMessageId = String(active.id);
        const overId = String(over.id);

        const fromStatus = findStatusOf(board, activeMessageId, statuses);
        if (!fromStatus) return;

        let toStatus: EmailStatus | null = null;

        // drop on column
        if (statuses.includes(overId as EmailStatus)) {
            toStatus = overId as EmailStatus;
        } else {
            // drop on another card -> infer that card's status
            const inferred = findStatusOf(board, overId, statuses);
            if (inferred) toStatus = inferred;
        }

        if (!toStatus || toStatus === fromStatus) return;

        onMoveItem(activeMessageId, toStatus);
    };

    const activeItem = activeId ? findItem(board, activeId, statuses) : null;

    const gridClass =
        statuses.length <= 3
            ? "grid gap-4 lg:grid-cols-3"
            : "grid gap-4 lg:grid-cols-4";

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e) => setActiveId(String(e.active.id))}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={handleDragEnd}
        >
            <div className={gridClass}>
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.status}
                        title={col.title}
                        status={col.status}
                        items={col.items}
                        onMoveItem={onMoveItem}
                        onSnoozeItem={onSnoozeItem}
                        loadingMap={loadingMap}
                        summarizingMap={summarizingMap}
                    />
                ))}
            </div>

            {/* ✅ Overlay dùng preview KHÔNG xài useSortable */}
            <DragOverlay>
                {activeItem ? (
                    <div className="w-[280px]">
                        <KanbanCardPreview item={activeItem} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
