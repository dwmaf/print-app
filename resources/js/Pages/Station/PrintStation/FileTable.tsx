import React, { useState } from "react";
import { Trash2, Printer, QrCode as QrIcon, EyeOff } from "lucide-react";
import { FileToPrint } from "./index";

// INTERFACES DEFINITIONS
interface PrintRequest {
    id: number;
    request_id: string | number;
}

interface FileTableProps {
    filetoprints: FileToPrint[]; // ✨ Ganti dari FileItem[] menjadi FileToPrint[]
    selectedIds: number[];
    stationName: string;
    qrCode: string | null;
    onUpdateSelectedIds: (ids: number[]) => void;

    // ✨ Ganti parameter fungsi dari FileItem menjadi FileToPrint
    onOpenPrintModal: (file: FileToPrint) => void;
    onOpenDeleteModal: (file: FileToPrint) => void;

    onDeleteMultiple: () => void;
}

export default function FileTable({
    filetoprints = [],
    selectedIds = [],
    stationName,
    qrCode,
    onUpdateSelectedIds,
    onOpenPrintModal,
    onOpenDeleteModal,
    onDeleteMultiple,
}: FileTableProps) {
    // STATE LOKAL: Untuk toggle QR Code dropdown ala Vue template
    const [showLocalQr, setShowLocalQr] = useState<boolean>(false);

    // METHOD: Menggantikan toggleSelectAll Vue
    const handleToggleSelectAll = (checked: boolean) => {
        const ids = checked ? filetoprints.map((f) => f.id) : [];
        onUpdateSelectedIds(ids);
    };

    // METHOD: Menggantikan toggleSelect Vue
    const handleToggleSelect = (id: number, checked: boolean) => {
        let newIds = [...selectedIds];
        if (checked) {
            newIds.push(id);
        } else {
            newIds = newIds.filter((i) => i !== id);
        }
        onUpdateSelectedIds(newIds);
    };

    // METHOD: Fungsi format waktu relatif (Sama persis dengan logika Vue kamu)
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

        if (diffInSeconds < 60) {
            return rtf.format(-diffInSeconds, "second");
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return rtf.format(-diffInMinutes, "minute");
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return rtf.format(-diffInHours, "hour");
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return rtf.format(-diffInDays, "day");
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white px-8 shadow-lg md:h-[calc(100vh-4rem)]">
            {/* HEADER SECTION */}
            <div className="mb-6 flex shrink-0 items-center justify-between pt-6">
                <div className="flex items-center gap-4">
                    <img src="/images/logo.png" className="w-18" alt="Logo" />
                    <div>
                        <h1 className="font-koulen text-5xl leading-none">
                            Printation
                        </h1>
                        <p className="font-roboto mt-1 text-sm font-medium tracking-wide text-gray-400 uppercase">
                            {stationName}
                        </p>
                    </div>

                    {/* Toggle Lokal QR */}
                    <button
                        type="button"
                        onClick={() => setShowLocalQr((prev) => !prev)}
                        className={`ml-2 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition-all ${
                            showLocalQr
                                ? "border-amber-600 bg-amber-500 text-white"
                                : "border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50"
                        }`}
                    >
                        {showLocalQr ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <QrIcon className="h-4 w-4" />
                        )}
                        {showLocalQr ? "Tutup QR" : "Tampilkan QR"}
                    </button>

                    {/* Bulk Delete Button */}
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            onClick={onDeleteMultiple}
                            className="animate-in fade-in slide-in-from-left-4 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-100 transition-all duration-200 hover:bg-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus {selectedIds.length} File
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="font-bold text-gray-500">
                        {filetoprints.length} file terupload
                    </div>
                </div>
            </div>

            {/* LOCAL QR CODE DROPDOWN */}
            {showLocalQr && qrCode && (
                <div className="animate-in fade-in slide-in-from-top-1 mb-6 flex shrink-0 justify-center transition-all duration-250 ease-out">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-5">
                        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-inner">
                            <div
                                className="[&>svg]:block [&>svg]:h-52 [&>svg]:w-52 md:[&>svg]:h-60 md:[&>svg]:w-60"
                                dangerouslySetInnerHTML={{ __html: qrCode }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* SCROLLABLE TABLE CONTAINMENT */}
            <div className="min-h-0 w-full flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-x-auto overflow-y-auto pb-4">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr className="text-left text-sm font-semibold text-gray-700">
                            <th className="w-12 p-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedIds.length ===
                                            filetoprints.length &&
                                        filetoprints.length > 0
                                    }
                                    onChange={(e) =>
                                        handleToggleSelectAll(e.target.checked)
                                    }
                                    className="h-4 w-4 cursor-pointer rounded accent-blue-600"
                                />
                            </th>
                            <th className="w-20 p-3 text-center text-lg">
                                Tipe
                            </th>
                            <th className="p-3 text-lg">Nama File</th>
                            <th className="p-3 text-lg">Diunggah</th>
                            <th className="p-3 text-center text-lg">Status</th>
                            <th className="p-3 text-center text-lg">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filetoprints.map((file) => (
                            <tr
                                key={file.id}
                                className="transition-colors hover:bg-blue-50/50"
                            >
                                {/* Individual Checkbox */}
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(file.id)}
                                        onChange={(e) =>
                                            handleToggleSelect(
                                                file.id,
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 cursor-pointer rounded accent-blue-600"
                                    />
                                </td>

                                {/* File Type Badge */}
                                <td className="p-4">
                                    <div
                                        className={`mx-auto w-fit rounded px-2 py-1 text-xs font-black ${
                                            file.type === "PDF"
                                                ? "bg-red-100 text-red-600"
                                                : "bg-blue-100 text-blue-600"
                                        }`}
                                    >
                                        {file.type}
                                    </div>
                                </td>

                                {/* File Name & Request Details */}
                                <td className="max-w-xs truncate p-4 font-medium text-gray-900">
                                    {file.original_name}
                                    {file.latest_print_request && (
                                        <div className="mt-1">
                                            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-800">
                                                REQ:{" "}
                                                {
                                                    file.latest_print_request
                                                        .request_id
                                                }
                                            </span>
                                        </div>
                                    )}
                                </td>

                                {/* Uploaded Time */}
                                <td className="p-4 text-sm whitespace-nowrap text-gray-500">
                                    {formatTime(file.created_at)}
                                </td>

                                {/* Status Column */}
                                <td className="p-4 text-center whitespace-nowrap">
                                    {!file.latest_print_request && (
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                                            BELUM REQ
                                        </span>
                                    )}
                                    {file.latest_print_request &&
                                        file.status === "pending" && (
                                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                                                PENDING
                                            </span>
                                        )}
                                    {file.latest_print_request &&
                                        file.status === "verified" && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                                VERIFIED
                                            </span>
                                        )}
                                    {file.latest_print_request &&
                                        file.status === "rejected" && (
                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                                REJECTED
                                            </span>
                                        )}
                                    {file.latest_print_request &&
                                        file.status === "completed" && (
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                COMPLETED
                                            </span>
                                        )}
                                </td>

                                {/* Action Buttons */}
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onOpenPrintModal(file)
                                            }
                                            className={`rounded-lg p-2 transition-colors ${
                                                !file.status ||
                                                ["new", "rejected"].includes(
                                                    file.status,
                                                )
                                                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                    : file.status === "pending"
                                                      ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                                      : file.status ===
                                                          "verified"
                                                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                                                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                            }`}
                                            title="Print Options"
                                        >
                                            <Printer className="h-5 w-5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onOpenDeleteModal(file)
                                            }
                                            className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                                            title="Hapus File"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
