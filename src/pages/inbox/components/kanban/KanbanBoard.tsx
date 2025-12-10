// src/pages/inbox/components/kanban/KanbanBoard.tsx
import {
    DndContext,
    closestCorners,
    type DragEndEvent,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    pointerWithin,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { KanbanBoardData, KanbanEmailItem } from "@/lib/api";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCardPreview } from "./KanbanCardPreview";
import {
    COLUMN_TITLES,
    DEFAULT_KANBAN_STATUSES,
    type EmailStatus,
} from "./constants";

function findItem(board: KanbanBoardData, messageId: string, statuses: EmailStatus[]) {
    for (const st of statuses) {
        const found = (board as any)[st]?.find((i: KanbanEmailItem) => i.messageId === messageId);
        if (found) return found;
    }
    return null;
}

export function KanbanBoard({
    board,
    onMoveItem,
    onSnoozeItem,
    onOpenMail,
    loadingMap,
    summarizingMap,
    statuses = DEFAULT_KANBAN_STATUSES,
}: {
    board: KanbanBoardData;
    onMoveItem: (messageId: string, status: EmailStatus) => void;
    onSnoozeItem: (messageId: string, untilIso: string) => void;
    onOpenMail?: (emailId: string) => void;
    loadingMap: Record<string, boolean>;
    summarizingMap: Record<string, boolean>;
    statuses?: EmailStatus[];
}) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

        const activeIdStr = String(active.id);

        const activeData = active.data.current as any;
        const overData = over.data.current as any;

        const fromStatus = activeData?.status as EmailStatus | undefined;
        const toStatus =
            overData?.type === "column"
                ? (overData.status as EmailStatus)
                : (overData?.status as EmailStatus | undefined);

        if (!fromStatus || !toStatus) return;
        if (fromStatus === toStatus) return;

        onMoveItem(activeIdStr, toStatus);
    };

    const activeItem = activeId ? findItem(board, activeId, statuses) : null;

    const gridClass =
        statuses.length <= 3 ? "grid gap-4 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-4";

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={(args) => {
                const pointer = pointerWithin(args);
                return pointer.length ? pointer : closestCorners(args);
            }}
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
                        onSnoozeItem={onSnoozeItem}
                        onOpenMail={onOpenMail}
                        loadingMap={loadingMap}
                        summarizingMap={summarizingMap}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem ? (
                    <div className="w-[300px]">
                        <KanbanCardPreview item={activeItem} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
