import React, { useEffect, useState, useCallback } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { PDFDocument } from "pdf-lib";

// COMPONENTS
import EmptyQR from "./EmptyQR";
import FileTable from "./FileTable";
import PrintConfig from "./PrintConfig";
import DeleteModal from "./Modals/DeleteModal";

// INTERFACES
interface PrintRequest {
    id: number;
    copies?: number;
    color_mode?: "color" | "mono";
    paper_size?: string;
    page_range?: string;
    detected_pages?: number;
}

export interface FileToPrint {
    id: number;
    type: string;
    original_name: string; // Tambahkan ini
    created_at: string; // Tambahkan ini
    url: string;
    status?: string;
    latest_print_request?: {
        id: number;
        request_id: string | number; // Tambahkan ini agar cocok dengan data internal tabel
        copies?: number;
        color_mode?: "color" | "mono";
        paper_size?: string;
        page_range?: string;
        detected_pages?: number;
    } | null;
}

export interface ConfigState {
    pages: number;
    paperSize: "A4" | "Legal" | string;
    pageOption: "all" | "custom" | string;
    customPages: string;
    copies: number;
    colorMode: "color" | "mono" | "bw"; // Sesuaikan dengan opsi yang kamu pakai
}

interface PageProps {
    filetoprints: FileToPrint[];
    qrCode: string | null;
    stationId: number;
    auth: {
        user: {
            name: string;
        };
    };
}

export default function PrintStationPage() {
    // Ambil props global dari Inertia Page Context
    const {
        filetoprints = [],
        qrCode = null,
        stationId,
        auth,
    } = usePage<any>().props as PageProps;

    console.log({ filetoprints, qrCode, stationId, auth });

    // STATE MODAL
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] =
        useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // STATE DATA
    const [currentFile, setCurrentFile] = useState<FileToPrint | null>(null);
    const [fileToDelete, setFileToDelete] = useState<FileToPrint | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showQr, setShowQr] = useState<boolean>(filetoprints.length === 0);

    const [config, setConfig] = useState<ConfigState>({
        copies: 1,
        colorMode: "color",
        paperSize: "A4",
        pageOption: "all",
        customPages: "",
        pages: 1,
    });

    // WATCHER REPLACEMENT: Sinkronisasi QR State ketika data file berubah
    useEffect(() => {
        if (filetoprints.length === 0) {
            setShowQr(true);
        } else {
            setShowQr(false);
        }
    }, [filetoprints.length]);

    // REALTIME WEBSOCKET: Laravel Echo
    useEffect(() => {
        const echo = (window as any).Echo;
        if (echo) {
            // Fungsi helper untuk reload yang aman dari error TypeScript
            const reloadPage = () => {
                router.visit(window.location.href, {
                    method: "get",
                    replace: true,
                    preserveScroll: true, // Di sini 'preserveScroll' 100% valid secara type definition
                    preserveState: true,
                });
            };

            const channel = echo
                .channel(`printing-channel.${stationId}`)
                .listen(".file.uploaded", reloadPage)
                .listen(".transaction.updated", reloadPage);

            return () => {
                channel.stopListening(".file.uploaded");
                channel.stopListening(".transaction.updated");
            };
        }
    }, [stationId]);

    // METHODS: Handler Aksi Modal Cetak
    const openPrintModal = useCallback(async (file: FileToPrint) => {
        setCurrentFile(file);

        // Set baseline konfigurasi awal
        let targetConfig: ConfigState = {
            copies: 1,
            colorMode: "color",
            paperSize: "A4",
            pageOption: "all",
            customPages: "",
            pages: 1,
        };

        if (file.latest_print_request) {
            const v = file.latest_print_request;
            targetConfig = {
                copies: v.copies || 1,
                colorMode: v.color_mode || "color",
                paperSize: v.paper_size || "A4",
                pageOption: v.page_range === "all" ? "all" : "custom",
                customPages: v.page_range === "all" ? "" : v.page_range || "",
                pages: v.detected_pages || 1,
            };
            setConfig(targetConfig);
        } else {
            setConfig(targetConfig);
        }

        setModalOpen(true);

        // Otomatis Deteksi Jumlah Halaman File PDF jika belum pernah di-request
        if (file.type === "PDF" && !file.latest_print_request) {
            try {
                // Panggil helper route ziggy global laravel
                const proxyUrl = (window as any).route(
                    "upa.station.proxy-pdf",
                    file.id,
                );
                const response = await fetch(proxyUrl);

                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);

                const arrayBuffer = await response.arrayBuffer();
                if (arrayBuffer.byteLength === 0)
                    throw new Error("File PDF kosong atau corrupt.");

                const pdfDoc = await PDFDocument.load(arrayBuffer, {
                    ignoreEncryption: true,
                });

                setConfig((prev) => ({
                    ...prev,
                    pages: pdfDoc.getPageCount(),
                }));
                console.log("Success detect pages:", pdfDoc.getPageCount());
            } catch (e) {
                console.error("Gagal menghitung halaman:", e);
                setConfig((prev) => ({ ...prev, pages: 1 })); // Fallback
            }
        } else if (file.type !== "PDF" && !file.latest_print_request) {
            setConfig((prev) => ({ ...prev, pages: 1 }));
        }
    }, []);

    const closePrintModal = useCallback(() => {
        setModalOpen(false);
        setCurrentFile(null);
    }, []);

    // METHODS: Kirim Konfigurasi Cetak ke Laravel
    const submitRequest = useCallback(() => {
        if (!currentFile) return;

        const payload = {
            file_id: currentFile.id,
            station_id: stationId,
            print_config: {
                copies: config.copies,
                color: config.colorMode,
                paper: config.paperSize,
                pages:
                    config.pageOption === "custom" ? config.customPages : "all",
                detected_pages: config.pages,
            },
        };

        router.post(
            (window as any).route("upa.station.request-print"),
            payload,
            {
                onSuccess: () => {
                    setModalOpen(false);
                },
                onFinish: () => router.reload(),
            },
        );
    }, [currentFile, config, stationId]);

    // METHODS: Eksekusi Kirim ke Mesin Printer Fisik
    const executePrint = useCallback(async () => {
        if (!currentFile?.latest_print_request) return;
        setLoading(true);

        try {
            const response = await axios.post(
                (window as any).route("upa.station.print"),
                {
                    request_id: currentFile.latest_print_request.id,
                },
            );

            if (response.data.status === "success") {
                alert(response.data.message);
                closePrintModal();
                router.reload();
            } else {
                alert(response.data.message);
            }
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                    "Gagal mengirim perintah cetak.",
            );
        } finally {
            setLoading(false);
        }
    }, [currentFile, closePrintModal]);

    // METHODS: Handler Aksi Hapus File Tunggal
    const openDeleteModal = useCallback((file: FileToPrint) => {
        setFileToDelete(file);
        setDeleteModalOpen(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (fileToDelete) {
            router.delete(
                (window as any).route("upa.station.destroy", fileToDelete.id),
                {
                    onSuccess: () => {
                        setDeleteModalOpen(false);
                        setFileToDelete(null);
                    },
                },
            );
        }
    }, [fileToDelete]);

    // METHODS: Handler Aksi Hapus Massal (Bulk Delete)
    const confirmBulkDelete = useCallback(() => {
        router.delete((window as any).route("upa.station.destroy-multiple"), {
            data: { file_ids: selectedIds },
            onSuccess: () => {
                setSelectedIds([]);
                setBulkDeleteModalOpen(false);
            },
            onError: () => {
                setBulkDeleteModalOpen(false);
            },
        });
    }, [selectedIds]);

    return (
        <div className="font-roboto flex min-h-screen flex-col bg-[#FAFAFA] p-4 text-gray-800 md:p-8">
            <Head title="Print Station" />

            {/* EMPTY / QR STATE */}
            {(filetoprints.length === 0 || showQr) && (
                <EmptyQR
                    qrCode={qrCode}
                    showQr={showQr}
                    stationName={auth.user.name}
                    onToggleQr={() => setShowQr((prev) => !prev)}
                />
            )}

            {/* FILE TABLE STATE */}
            {filetoprints.length > 0 && (
                <FileTable
                    filetoprints={filetoprints}
                    qrCode={qrCode}
                    selectedIds={selectedIds}
                    stationName={auth.user.name}
                    onUpdateSelectedIds={setSelectedIds}
                    onOpenPrintModal={openPrintModal}
                    onOpenDeleteModal={openDeleteModal}
                    onDeleteMultiple={() => setBulkDeleteModalOpen(true)}
                />
            )}

            {/* CONFIGURATION AND PREVIEW MODAL */}
            <PrintConfig
                show={modalOpen}
                currentFile={currentFile}
                config={config}
                loading={loading}
                onConfigChange={setConfig} // Memberikan akses merubah konfigurasi di child component
                onClose={closePrintModal}
                onSubmit={submitRequest}
                onExecute={executePrint}
            />

            {/* SINGLE DELETE MODAL */}
            <DeleteModal
                show={deleteModalOpen}
                id={currentFile?.id || null} // ✨ PASTIKAN UNTUK MENGIRIM ID DI SINI
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />

            {/* BULK DELETE MODAL */}
            <DeleteModal
                show={bulkDeleteModalOpen}
                isBulk={true}
                title={`Hapus ${selectedIds.length} File?`}
                message="Semua file yang dipilih akan dihapus permanen dari server."
                confirmText="Hapus Semua"
                onClose={() => setBulkDeleteModalOpen(false)}
                onConfirm={confirmBulkDelete}
            />
        </div>
    );
}
