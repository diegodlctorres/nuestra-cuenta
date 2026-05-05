import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    CalendarPlus,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    PauseCircle,
    Pencil,
    Repeat,
    Trash2,
} from "lucide-react";
import {
    addMonths,
    addWeeks,
    endOfMonth,
    endOfWeek,
    format,
    isAfter,
    parseISO,
    startOfMonth,
    startOfWeek,
    subMonths,
    subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { TaskFormModal } from "../components/tasks/AddTaskForm";
import { TransactionModal } from "../components/transactions/AddTransactionForm";
import { Modal } from "../components/ui/Modal";
import { InlineFeedback } from "../components/ui/InlineFeedback";
import { cn } from "../lib/utils";
import { MutationResult, mutationMessage } from "../lib/errors";
import { ReminderViewRange } from "../hooks/useTasks";
import { RenderableTaskReminder, Transaction } from "../types";
import { buildTaskInputFromTask } from "../lib/taskRecurrence";
import { useTasksContext } from "../contexts/TasksContext";
import { useFinance } from "../contexts/FinanceContext";

type ReminderPeriod = "month" | "week";
type DeleteMode = "single" | "series";

function getRangeForPeriod(
    period: ReminderPeriod,
    cursorDate: Date,
): ReminderViewRange {
    if (period === "week") {
        const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
        const end = endOfWeek(cursorDate, { weekStartsOn: 1 });
        return {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
        };
    }

    const start = startOfMonth(cursorDate);
    const end = endOfMonth(cursorDate);
    return {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
    };
}

function formatRangeLabel(period: ReminderPeriod, cursorDate: Date) {
    if (period === "week") {
        const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
        const end = endOfWeek(cursorDate, { weekStartsOn: 1 });
        return `${format(start, "dd MMM", { locale: es })} - ${format(end, "dd MMM yyyy", { locale: es })}`;
    }

    return format(cursorDate, "MMMM yyyy", { locale: es });
}

function DeleteReminderModal({
    reminder,
    isOpen,
    onClose,
    onDeleteSingle,
    onDeleteSeries,
}: {
    reminder: RenderableTaskReminder | null;
    isOpen: boolean;
    onClose: () => void;
    onDeleteSingle: () => Promise<MutationResult>;
    onDeleteSeries: () => Promise<MutationResult>;
}) {
    const [isSubmitting, setIsSubmitting] = useState<DeleteMode | null>(null);

    if (!reminder) return null;

    const handleSingleDelete = async () => {
        setIsSubmitting("single");
        const result = await onDeleteSingle();
        setIsSubmitting(null);
        if (result.ok) onClose();
    };

    const handleSeriesDelete = async () => {
        setIsSubmitting("series");
        const result = await onDeleteSeries();
        setIsSubmitting(null);
        if (result.ok) onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!isSubmitting) onClose();
            }}
            title="Eliminar recordatorio"
        >
            <div className="space-y-5">
                <div className="rounded-2xl border border-secondary-100 bg-secondary-50 p-4">
                    <p className="text-sm font-semibold text-secondary-700">
                        {reminder.isRecurring
                            ? "Elige cómo quieres eliminar esta recurrencia."
                            : "Vas a eliminar este recordatorio."}
                    </p>
                    <p className="mt-2 text-sm text-secondary-600">
                        {reminder.isRecurring
                            ? "Puedes borrar solo esta fecha o cortar toda la serie desde esta ocurrencia en adelante."
                            : "Esta acción no se puede deshacer."}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-800">
                        {reminder.title}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        {format(
                            parseISO(reminder.occurrenceDate),
                            "dd MMM yyyy",
                            { locale: es },
                        )}
                        {reminder.occurrenceDueTime &&
                            ` • ${reminder.occurrenceDueTime.slice(0, 5)}`}
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleSingleDelete}
                        disabled={Boolean(isSubmitting)}
                        className="w-full rounded-2xl border border-secondary-200 bg-secondary-50 py-3 text-sm font-bold text-secondary-700 transition-colors hover:bg-secondary-100 disabled:opacity-60"
                    >
                        {isSubmitting === "single"
                            ? "Eliminando..."
                            : reminder.isRecurring
                              ? "Eliminar solo esta ocurrencia"
                              : "Eliminar recordatorio"}
                    </button>

                    {reminder.isRecurring && (
                        <button
                            type="button"
                            onClick={handleSeriesDelete}
                            disabled={Boolean(isSubmitting)}
                            className="w-full rounded-2xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
                        >
                            {isSubmitting === "series"
                                ? "Cortando serie..."
                                : "Eliminar esta y las siguientes"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={Boolean(isSubmitting)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function TaskItem({
    reminder,
    onOpen,
    onToggle,
    onDeleteRequest,
    onDownloadICS,
}: {
    reminder: RenderableTaskReminder;
    onOpen: () => void;
    onToggle: () => void;
    onDeleteRequest: () => void;
    onDownloadICS: () => void;
}) {
    const isOverdue =
        !reminder.completed &&
        isAfter(new Date(), parseISO(reminder.occurrenceDate));
    const [offsetX, setOffsetX] = useState(0);
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);
    const [isTouchLikeDevice, setIsTouchLikeDevice] = useState(false);
    const startXRef = useRef<number | null>(null);
    const dragStartOffsetRef = useRef(0);
    const pointerTypeRef = useRef<string | null>(null);
    const SWIPE_ACTION_WIDTH = 96;
    const SWIPE_THRESHOLD = 48;

    useEffect(() => {
        const mediaQuery = window.matchMedia("(pointer: coarse)");

        const updatePointerMode = () => {
            setIsTouchLikeDevice(mediaQuery.matches);
        };

        updatePointerMode();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", updatePointerMode);
            return () =>
                mediaQuery.removeEventListener("change", updatePointerMode);
        }

        mediaQuery.addListener(updatePointerMode);
        return () => mediaQuery.removeListener(updatePointerMode);
    }, []);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isTouchLikeDevice) return;
        pointerTypeRef.current = event.pointerType;
        if (event.pointerType === "mouse") return;
        startXRef.current = event.clientX;
        dragStartOffsetRef.current = offsetX;
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (
            !isTouchLikeDevice ||
            startXRef.current === null ||
            pointerTypeRef.current === "mouse"
        )
            return;
        const deltaX = event.clientX - startXRef.current;
        const nextOffset = Math.max(
            -SWIPE_ACTION_WIDTH,
            Math.min(0, dragStartOffsetRef.current + deltaX),
        );
        setOffsetX(nextOffset);
    };

    const handlePointerEnd = () => {
        if (!isTouchLikeDevice) return;
        if (pointerTypeRef.current === "mouse") {
            pointerTypeRef.current = null;
            return;
        }

        if (startXRef.current === null) return;

        const shouldOpen = offsetX <= -SWIPE_THRESHOLD;
        setOffsetX(shouldOpen ? -SWIPE_ACTION_WIDTH : 0);
        setIsSwipeOpen(shouldOpen);
        startXRef.current = null;
        pointerTypeRef.current = null;
    };

    const closeSwipe = () => {
        setOffsetX(0);
        setIsSwipeOpen(false);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-y-0 right-0 flex items-stretch">
                <button
                    type="button"
                    onClick={() => {
                        closeSwipe();
                        onDeleteRequest();
                    }}
                    className="w-24 bg-secondary-600 text-white text-xs font-bold uppercase tracking-wider"
                    aria-label="Eliminar recordatorio"
                    title="Eliminar recordatorio"
                >
                    <Trash2 className="mx-auto w-4 h-4" />
                </button>
            </div>

            <div
                className={cn(
                    "bg-white p-4 rounded-2xl border transition-all flex items-center gap-4 shadow-sm group",
                    reminder.completed
                        ? "opacity-60 border-slate-100"
                        : "border-slate-200",
                    isOverdue && !reminder.completed
                        ? "border-secondary-200 bg-secondary-50/30"
                        : "",
                    isTouchLikeDevice && "touch-pan-y",
                )}
                style={{
                    transform: `translateX(${offsetX}px)`,
                    touchAction: isTouchLikeDevice ? "pan-y" : undefined,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onClick={() => {
                    if (isSwipeOpen) {
                        closeSwipe();
                        return;
                    }

                    onOpen();
                }}
            >
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggle();
                    }}
                    className={cn(
                        "transition-colors shrink-0",
                        reminder.completed
                            ? "text-primary-600"
                            : "text-slate-300 hover:text-primary-400",
                    )}
                >
                    {reminder.completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                    ) : (
                        <Circle className="w-6 h-6" />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <div
                        className={cn(
                            "font-medium text-sm",
                            reminder.completed && "line-through text-slate-400",
                        )}
                    >
                        {reminder.title}
                    </div>
                    <div
                        className={cn(
                            "text-xs flex items-center gap-1 mt-1 flex-wrap",
                            isOverdue &&
                                !reminder.completed &&
                                "text-secondary-600 font-medium",
                            !isOverdue || reminder.completed
                                ? "text-slate-400"
                                : "",
                        )}
                    >
                        <Calendar className="w-3 h-3" />
                        {format(
                            parseISO(reminder.occurrenceDate),
                            "dd MMM yyyy",
                            { locale: es },
                        )}
                        {reminder.occurrenceDueTime &&
                            ` • ${reminder.occurrenceDueTime.slice(0, 5)}`}
                        {isOverdue && !reminder.completed && " (Vencido)"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {reminder.isRecurring && reminder.recurrenceLabel && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-700">
                                <Repeat className="w-3 h-3" />
                                {reminder.recurrenceLabel}
                            </span>
                        )}
                        {reminder.requiresTransaction && (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                Transacción
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!reminder.completed && (
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onDownloadICS();
                            }}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-slate-100"
                            title="Añadir al Calendario"
                        >
                            <CalendarPlus className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDeleteRequest();
                        }}
                        className={cn(
                            "rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-all",
                            isTouchLikeDevice
                                ? "opacity-0 pointer-events-none"
                                : "opacity-100 pointer-events-auto hover:border-secondary-200 hover:bg-secondary-50 hover:text-secondary-600",
                        )}
                        aria-label="Eliminar recordatorio"
                        title="Eliminar recordatorio"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function TasksView() {
    const {
        tasks,
        addTask,
        updateTask,
        completeReminder,
        reopenReminder,
        deleteReminder,
        deleteSeriesFromReminder,
        archiveTaskSeries,
        downloadICS,
        setViewRange,
    } = useTasksContext();
    const { addTransaction, categories, accounts } = useFinance();
    const [selectedReminderId, setSelectedReminderId] = useState<string | null>(
        null,
    );
    const [transactionReminderId, setTransactionReminderId] = useState<
        string | null
    >(null);
    const [editingReminderId, setEditingReminderId] = useState<string | null>(
        null,
    );
    const [archiveConfirmReminderId, setArchiveConfirmReminderId] = useState<
        string | null
    >(null);
    const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
        null,
    );
    const [period, setPeriod] = useState<ReminderPeriod>("month");
    const [periodCursor, setPeriodCursor] = useState(() => new Date());
    const [actionError, setActionError] = useState("");

    const selectedReminder = useMemo(
        () => tasks.find((task) => task.id === selectedReminderId) || null,
        [selectedReminderId, tasks],
    );
    const transactionReminder = useMemo(
        () => tasks.find((task) => task.id === transactionReminderId) || null,
        [tasks, transactionReminderId],
    );
    const editingReminder = useMemo(
        () => tasks.find((task) => task.id === editingReminderId) || null,
        [editingReminderId, tasks],
    );
    const archiveConfirmReminder = useMemo(
        () =>
            tasks.find((task) => task.id === archiveConfirmReminderId) || null,
        [archiveConfirmReminderId, tasks],
    );
    const deleteCandidate = useMemo(
        () =>
            tasks.find((task) => task.id === deleteCandidateId) ||
            selectedReminder,
        [deleteCandidateId, selectedReminder, tasks],
    );
    const visibleRange = useMemo(
        () => getRangeForPeriod(period, periodCursor),
        [period, periodCursor],
    );
    const rangeLabel = useMemo(
        () => formatRangeLabel(period, periodCursor),
        [period, periodCursor],
    );

    useEffect(() => {
        setViewRange(visibleRange);
    }, [setViewRange, visibleRange]);

    const handleToggleReminder = async (reminder: RenderableTaskReminder) => {
        if (!reminder.completed && reminder.requiresTransaction) {
            setTransactionReminderId(reminder.id);
            return;
        }

        if (reminder.completed) {
            const result = await reopenReminder(reminder);
            if (!result.ok) setActionError(result.message);
            return;
        }

        const result = await completeReminder(reminder);
        if (!result.ok) setActionError(result.message);
    };

    const handleTransactionForReminder = async (
        transaction: Omit<Transaction, "id" | "household_id" | "created_by">,
    ) => {
        if (!transactionReminder) {
            return mutationMessage("No se encontró el recordatorio asociado.");
        }

        const transactionSaved = await addTransaction(transaction);
        if (!transactionSaved.ok) return transactionSaved;

        const reminderCompleted = await completeReminder(transactionReminder);
        if (reminderCompleted.ok) {
            setTransactionReminderId(null);
            if (selectedReminderId === transactionReminder.id)
                setSelectedReminderId(null);
        }

        return reminderCompleted;
    };

    const closeDeleteModal = () => setDeleteCandidateId(null);

    const movePeriod = (direction: "previous" | "next") => {
        setPeriodCursor((current) => {
            if (period === "week") {
                return direction === "next"
                    ? addWeeks(current, 1)
                    : subWeeks(current, 1);
            }

            return direction === "next"
                ? addMonths(current, 1)
                : subMonths(current, 1);
        });
    };

    return (
        <motion.div
            key="tasks"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Recordatorios</h2>

                {actionError && <InlineFeedback message={actionError} />}

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        {(["month", "week"] as ReminderPeriod[]).map(
                            (option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        setPeriod(option);
                                        setPeriodCursor(new Date());
                                    }}
                                    className={cn(
                                        "flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition-colors",
                                        period === option
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-100"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                                    )}
                                >
                                    {option === "month" ? "Mes" : "Semana"}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => movePeriod("previous")}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
                            aria-label="Periodo anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="min-w-0 text-center">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                {period === "month"
                                    ? "Periodo mensual"
                                    : "Periodo semanal"}
                            </div>
                            <div className="mt-1 text-base font-bold text-slate-800 capitalize">
                                {rangeLabel}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => movePeriod("next")}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
                            aria-label="Periodo siguiente"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800">
                        No hay recordatorios en este periodo
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Cambia entre semana y mes o navega al siguiente periodo
                        para revisar más ocurrencias.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tasks.map((reminder) => (
                        <TaskItem
                            key={reminder.id}
                            reminder={reminder}
                            onOpen={() => setSelectedReminderId(reminder.id)}
                            onToggle={() => handleToggleReminder(reminder)}
                            onDeleteRequest={() =>
                                setDeleteCandidateId(reminder.id)
                            }
                            onDownloadICS={() => downloadICS(reminder)}
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={!!selectedReminder}
                onClose={() => setSelectedReminderId(null)}
                title="Detalle del recordatorio"
            >
                {selectedReminder && (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <h3 className="text-xl font-bold text-slate-800">
                                {selectedReminder.title}
                            </h3>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary-500" />
                                    <span>
                                        {format(
                                            parseISO(
                                                selectedReminder.occurrenceDate,
                                            ),
                                            "dd MMMM yyyy",
                                            { locale: es },
                                        )}
                                        {selectedReminder.occurrenceDueTime &&
                                            ` • ${selectedReminder.occurrenceDueTime.slice(0, 5)}`}
                                    </span>
                                </div>
                                {selectedReminder.isRecurring &&
                                    selectedReminder.recurrenceLabel && (
                                        <div className="flex items-center gap-2">
                                            <Repeat className="w-4 h-4 text-primary-500" />
                                            <span>
                                                {
                                                    selectedReminder.recurrenceLabel
                                                }
                                            </span>
                                        </div>
                                    )}
                                {selectedReminder.completed &&
                                    selectedReminder.completedAt && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-primary-500" />
                                            <span>
                                                Completado el{" "}
                                                {format(
                                                    parseISO(
                                                        selectedReminder.completedAt,
                                                    ),
                                                    "dd MMM yyyy, HH:mm",
                                                    { locale: es },
                                                )}
                                            </span>
                                        </div>
                                    )}
                                {selectedReminder.requiresTransaction && (
                                    <div className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                        Requiere transacción para completar
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!selectedReminder) return;

                                    if (
                                        !selectedReminder.completed &&
                                        selectedReminder.requiresTransaction
                                    ) {
                                        setTransactionReminderId(
                                            selectedReminder.id,
                                        );
                                        return;
                                    }

                                    const result =
                                        selectedReminder.completed
                                            ? await reopenReminder(
                                                  selectedReminder,
                                              )
                                            : await completeReminder(
                                                  selectedReminder,
                                              );

                                    if (result.ok) {
                                        setSelectedReminderId(null);
                                    } else {
                                        setActionError(result.message);
                                    }
                                }}
                                className="w-full rounded-2xl bg-primary-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-100 transition-colors hover:bg-primary-700"
                            >
                                {selectedReminder.completed
                                    ? "Reabrir esta ocurrencia"
                                    : "Completar esta ocurrencia"}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setEditingReminderId(selectedReminder.id)
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Pencil className="w-4 h-4" />
                                    {selectedReminder.isRecurring
                                        ? "Editar serie"
                                        : "Editar recordatorio"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteCandidateId(selectedReminder.id)
                                }
                                className="w-full rounded-2xl border border-secondary-200 bg-secondary-50 py-3 text-sm font-bold text-secondary-700 transition-colors hover:bg-secondary-100"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    {selectedReminder.isRecurring
                                        ? "Eliminar ocurrencia o serie"
                                        : "Eliminar recordatorio"}
                                </span>
                            </button>

                            {selectedReminder.isRecurring && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setArchiveConfirmReminderId(
                                            selectedReminder.id,
                                        )
                                    }
                                    className="w-full rounded-2xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <PauseCircle className="w-4 h-4" />
                                        Detener serie desde hoy
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <DeleteReminderModal
                reminder={deleteCandidate}
                isOpen={!!deleteCandidate}
                onClose={closeDeleteModal}
                onDeleteSingle={async () => {
                    if (!deleteCandidate) {
                        return mutationMessage("No se encontró el recordatorio.");
                    }
                    const result = await deleteReminder(deleteCandidate);
                    if (result.ok && selectedReminderId === deleteCandidate.id)
                        setSelectedReminderId(null);
                    if (!result.ok) setActionError(result.message);
                    return result;
                }}
                onDeleteSeries={async () => {
                    if (!deleteCandidate) {
                        return mutationMessage("No se encontró el recordatorio.");
                    }
                    const result =
                        await deleteSeriesFromReminder(deleteCandidate);
                    if (result.ok && selectedReminderId === deleteCandidate.id)
                        setSelectedReminderId(null);
                    if (!result.ok) setActionError(result.message);
                    return result;
                }}
            />

            <TaskFormModal
                isOpen={!!editingReminder}
                onClose={() => setEditingReminderId(null)}
                onSubmit={async (task) => {
                    if (!editingReminder)
                        return {
                            ok: false,
                            message: "No se encontró el recordatorio.",
                        };

                    const result = await updateTask(
                        editingReminder.taskId,
                        task,
                    );
                    if (result.ok) {
                        setEditingReminderId(null);
                        setSelectedReminderId(null);
                    }
                    return result;
                }}
                initialTask={
                    editingReminder
                        ? buildTaskInputFromTask(editingReminder.task)
                        : undefined
                }
                title={
                    editingReminder?.isRecurring
                        ? "Editar serie"
                        : "Editar recordatorio"
                }
                submitLabel="Guardar cambios"
            />

            <Modal
                isOpen={!!archiveConfirmReminder}
                onClose={() => setArchiveConfirmReminderId(null)}
                title="Detener serie"
            >
                {archiveConfirmReminder && (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-sm font-semibold text-amber-700">
                                Vas a detener esta serie recurrente.
                            </p>
                            <p className="mt-2 text-sm text-amber-600">
                                No se generarán nuevas ocurrencias después de
                                hoy, pero el historial visible se conservará.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="text-sm font-bold text-slate-800">
                                {archiveConfirmReminder.title}
                            </div>
                            {archiveConfirmReminder.recurrenceLabel && (
                                <div className="mt-2 text-xs text-slate-500">
                                    {archiveConfirmReminder.recurrenceLabel}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setArchiveConfirmReminderId(null)
                                }
                                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!archiveConfirmReminder) return;
                                    const result = await archiveTaskSeries(
                                        archiveConfirmReminder.taskId,
                                    );
                                    if (result.ok) {
                                        setArchiveConfirmReminderId(null);
                                        if (
                                            selectedReminderId ===
                                            archiveConfirmReminder.id
                                        )
                                            setSelectedReminderId(null);
                                    } else {
                                        setActionError(result.message);
                                    }
                                }}
                                className="flex-1 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-100 transition-colors hover:bg-amber-600"
                            >
                                Detener serie
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <TransactionModal
                isOpen={!!transactionReminder}
                onClose={() => setTransactionReminderId(null)}
                onAdd={handleTransactionForReminder}
                categories={categories}
                accounts={accounts}
                initialDescription={
                    transactionReminder ? transactionReminder.title : ""
                }
                title="Registrar transacción pendiente"
            />
        </motion.div>
    );
}
