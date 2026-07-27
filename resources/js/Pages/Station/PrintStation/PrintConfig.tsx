import React, {
    useMemo,
    useEffect,
    useRef,
    Dispatch,
    SetStateAction,
} from "react";
import { Printer, Clock, CheckCircle, X } from "lucide-react";

import { FileToPrint, ConfigState } from "./index";

// 1. DEFINISI ANTARMUKA DATA (INTERFACES)
interface PrintRequest {
    id: number;
    request_id: string | number;
}

// 2. Gunakan tipe data hasil impor ke dalam Props komponen ini
interface PrintConfigProps {
    show: boolean;
    currentFile: FileToPrint | null;
    config: ConfigState;
    loading: boolean;
    // Ini adalah cara pengetikan Dispatch React yang sangat ketat dan aman
    onConfigChange: Dispatch<SetStateAction<ConfigState>>;
    onClose: () => void;
    onSubmit: () => void;
    onExecute: () => void;
}

export default function PrintConfig({
    show,
    currentFile,
    config,
    loading,
    onConfigChange,
    onClose,
    onSubmit,
    onExecute,
}: PrintConfigProps) {
    const customPagesInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (show && config.pageOption === "custom") {
            setTimeout(() => {
                customPagesInputRef.current?.focus();
            }, 50);
        }
    }, [config.pageOption, show]);

    // Fungsi helper pembantu mutasi state yang sekarang sudah type-safe
    const updateConfig = (key: keyof ConfigState, value: any) => {
        onConfigChange((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const calculatedPages = useMemo(() => {
        if (!config) return 0;
        if (config.pageOption === "all") return config.pages;

        const rangeStr = config.customPages;
        if (!rangeStr || !rangeStr.trim()) return 0;

        const pagesSet = new Set<number>();
        const parts = rangeStr.replace(/\s+/g, "").split(",");

        parts.forEach((part) => {
            if (part.includes("-")) {
                const [start, end] = part.split("-").map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (
                        let i = Math.max(1, start);
                        i <= Math.min(config.pages, end);
                        i++
                    ) {
                        pagesSet.add(i);
                    }
                }
            } else {
                const num = Number(part);
                if (!isNaN(num) && num >= 1 && num <= config.pages) {
                    pagesSet.add(num);
                }
            }
        });
        return pagesSet.size;
    }, [config.pageOption, config.customPages, config.pages]);

    const totalPageCount = useMemo(() => {
        return calculatedPages * (config?.copies || 1);
    }, [calculatedPages, config?.copies]);

    if (!show || !currentFile) return null;

    return (
        <div
            className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="animate-in zoom-in-95 flex h-[85vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
                {/* SISI KIRI: FILE PREVIEW */}
                <div className="relative flex w-2/3 items-center justify-center border-r border-gray-300 bg-gray-200">
                    <iframe
                        src={`${currentFile.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="h-full w-full bg-white"
                        title="File Preview"
                    />
                </div>

                {/* SISI KANAN: CONFIG PANEL */}
                <div className="flex h-full w-1/3 flex-col bg-gray-50">
                    {/* Header Panel */}
                    <div className="z-10 flex shrink-0 items-start justify-between bg-gray-50 p-6 pb-3">
                        <h2 className="font-koulen text-3xl">Konfigurasi</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer text-gray-400 transition-colors hover:text-red-500"
                        >
                            <X className="h-8 w-8" />
                        </button>
                    </div>

                    {/* Konten Scrollable */}
                    <div className="flex-1 space-y-6 overflow-y-auto p-6">
                        {/* Informasi File */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-bold break-all whitespace-normal text-gray-900">
                                {currentFile.original_name}
                            </div>
                            <div className="mt-1 text-xs font-bold text-gray-400">
                                <span className="uppercase">
                                    {currentFile.type}
                                </span>{" "}
                                • {config.pages} Halaman
                            </div>
                        </div>

                        {/* OPSI CONFIG: Hanya muncul jika status 'new' / 'rejected' / 'completed' / tanpa status */}
                        {!currentFile.status ||
                        ["new", "rejected", "new_upload", "completed"].includes(
                            currentFile.status,
                        ) ? (
                            <div className="space-y-4">
                                {/* Ukuran Kertas */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">
                                        Ukuran Kertas
                                    </label>
                                    <select
                                        value={config.paperSize}
                                        onChange={(e) =>
                                            updateConfig(
                                                "paperSize",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm font-bold text-gray-900 focus:ring-blue-500 focus:outline-blue-500"
                                    >
                                        <option value="A4">A4</option>
                                        <option value="Legal">
                                            Legal / F4
                                        </option>
                                    </select>
                                </div>

                                {/* Rentang Halaman */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">
                                        Rentang Halaman
                                    </label>
                                    <div className="mb-3 flex items-center space-x-4">
                                        <label className="flex cursor-pointer items-center">
                                            <input
                                                type="radio"
                                                value="all"
                                                checked={
                                                    config.pageOption === "all"
                                                }
                                                onChange={() =>
                                                    updateConfig(
                                                        "pageOption",
                                                        "all",
                                                    )
                                                }
                                                className="h-4 w-4 cursor-pointer accent-indigo-600"
                                            />
                                            <span className="ml-2 text-sm font-medium text-gray-900">
                                                Semua
                                            </span>
                                        </label>
                                        <label className="flex cursor-pointer items-center">
                                            <input
                                                type="radio"
                                                value="custom"
                                                checked={
                                                    config.pageOption ===
                                                    "custom"
                                                }
                                                onChange={() =>
                                                    updateConfig(
                                                        "pageOption",
                                                        "custom",
                                                    )
                                                }
                                                className="h-4 w-4 cursor-pointer accent-indigo-600"
                                            />
                                            <span className="ml-2 text-sm font-medium text-gray-900">
                                                Custom
                                            </span>
                                        </label>
                                    </div>

                                    {config.pageOption === "custom" && (
                                        <div>
                                            <input
                                                type="text"
                                                value={config.customPages}
                                                ref={customPagesInputRef}
                                                onChange={(e) =>
                                                    updateConfig(
                                                        "customPages",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: 1-5, 8, 11-13"
                                                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm font-bold focus:outline-indigo-500"
                                            />
                                            <p className="mt-1 text-[10px] font-semibold text-gray-400">
                                                Gunakan tanda hubung ( - ) untuk
                                                rentang dan koma ( , ) untuk
                                                halaman acak.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Jumlah Copies */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">
                                        Jumlah Copy
                                    </label>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateConfig(
                                                    "copies",
                                                    Math.max(
                                                        1,
                                                        config.copies - 1,
                                                    ),
                                                )
                                            }
                                            className="h-10 w-10 cursor-pointer rounded-l-lg bg-gray-100 font-bold hover:bg-gray-200"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={config.copies}
                                            className="h-10 w-full border-x-0 border-y border-gray-200 text-center text-xl font-bold text-gray-800 focus:ring-0"
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateConfig(
                                                    "copies",
                                                    config.copies + 1,
                                                )
                                            }
                                            className="h-10 w-10 cursor-pointer rounded-r-lg bg-gray-100 font-bold hover:bg-gray-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Mode Warna */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">
                                        Mode Warna
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="cursor-pointer">
                                            <input
                                                type="radio"
                                                value="color"
                                                checked={
                                                    config.colorMode === "color"
                                                }
                                                onChange={() =>
                                                    updateConfig(
                                                        "colorMode",
                                                        "color",
                                                    )
                                                }
                                                className="peer sr-only"
                                            />
                                            <div className="rounded-lg border-2 border-gray-200 p-2 text-center transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50 hover:bg-gray-50">
                                                <span className="block text-sm font-bold text-gray-700">
                                                    Berwarna
                                                </span>
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input
                                                type="radio"
                                                value="bw"
                                                checked={
                                                    config.colorMode === "bw"
                                                }
                                                onChange={() =>
                                                    updateConfig(
                                                        "colorMode",
                                                        "bw",
                                                    )
                                                }
                                                className="peer sr-only"
                                            />
                                            <div className="rounded-lg border-2 border-gray-200 p-2 text-center transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50 hover:bg-gray-50">
                                                <span className="text-sm font-bold text-gray-700">
                                                    Hitam Putih
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Live Kalkulasi Summary */}
                                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-600">
                                        <span>Kalkulasi</span>
                                        <span className="font-bold">
                                            {calculatedPages} Hal x{" "}
                                            {config.copies} Copy
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-blue-200 pt-3">
                                        <span className="text-lg font-extrabold text-blue-900">
                                            TOTAL
                                        </span>
                                        <span className="text-2xl font-black text-blue-600">
                                            {totalPageCount} Halaman
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* PANEL INFO READONLY: Untuk berkas berstatus PENDING / VERIFIED */
                            <div className="space-y-6">
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                    <p className="mb-2 text-[10px] font-bold text-indigo-400 uppercase">
                                        Konfigurasi Terpilih
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                Kertas
                                            </p>
                                            <p className="text-xs font-black text-gray-700">
                                                {config.paperSize}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                Warna
                                            </p>
                                            <p className="text-xs font-black text-gray-700 uppercase">
                                                {config.colorMode === "color"
                                                    ? "Berwarna"
                                                    : "H/P"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                Copy
                                            </p>
                                            <p className="text-xs font-black text-gray-700">
                                                {config.copies}x
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                Hal
                                            </p>
                                            <p className="text-xs font-black text-gray-700">
                                                {config.pageOption === "all"
                                                    ? "Semua"
                                                    : config.customPages}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status PENDING */}
                                {currentFile.status === "pending" && (
                                    <div className="py-4 text-center">
                                        <div className="mx-auto mb-4 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                                            <Clock className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xl font-black text-yellow-700 uppercase">
                                            MENUNGGU KONFIRMASI
                                        </h3>
                                        <p className="mt-2 text-sm font-bold text-yellow-500">
                                            Daftar verifikasi Anda sedang
                                            diproses oleh admin.
                                        </p>
                                        {currentFile.latest_print_request && (
                                            <div className="mt-10 rounded-xl border-2 border-dashed border-yellow-200 bg-white p-4 text-center">
                                                <p className="mb-1 text-[10px] font-bold text-gray-400 uppercase">
                                                    Kode Request
                                                </p>
                                                <p className="font-mono text-2xl font-black tracking-widest text-yellow-700">
                                                    {
                                                        currentFile
                                                            .latest_print_request
                                                            .request_id
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status VERIFIED */}
                                {currentFile.status === "verified" && (
                                    <div className="py-4 text-center">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <CheckCircle className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xl font-black text-green-700 uppercase">
                                            SIAP DICETAK
                                        </h3>
                                        <p className="mt-2 text-sm font-bold text-green-500">
                                            Permintaan telah disetujui. Silakan
                                            tekan tombol cetak.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ACTION TOMBOL FOOTER PANEL */}
                        <div className="space-y-3 pt-2">
                            {/* Tombol Submit jika File Baru */}
                            {(!currentFile.status ||
                                [
                                    "new",
                                    "rejected",
                                    "new_upload",
                                    "completed",
                                ].includes(currentFile.status)) && (
                                <button
                                    type="button"
                                    onClick={onSubmit}
                                    className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-xl bg-indigo-600 py-4 text-lg font-black text-white shadow-lg transition-all hover:bg-indigo-500"
                                >
                                    <span>SUBMIT REQUEST</span>
                                    <CheckCircle className="h-5 w-5" />
                                </button>
                            )}

                            {/* Tombol Eksekusi Printer jika File ter-Verified */}
                            {currentFile.status === "verified" && (
                                <div className="space-y-4">
                                    {currentFile.latest_print_request && (
                                        <div className="rounded-xl border-2 border-dashed border-green-200 bg-white p-4 text-center">
                                            <p className="mb-1 text-[10px] font-bold text-gray-400 uppercase">
                                                Kode Request
                                            </p>
                                            <p className="font-mono text-2xl font-black tracking-widest text-green-700">
                                                {
                                                    currentFile
                                                        .latest_print_request
                                                        .request_id
                                                }
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={onExecute}
                                        disabled={loading}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span>MENCETAK...</span>
                                        ) : (
                                            <>
                                                <span>CETAK SEKARANG</span>
                                                <Printer className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full cursor-pointer py-3 font-bold text-gray-500 transition-colors hover:text-gray-800"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
