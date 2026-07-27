import React from "react";
import { router } from "@inertiajs/react";

declare function route(
    name: string,
    parameters?:
        | string
        | number
        | null
        | Record<string, string | number | null>,
): string;

// Definisikan properti opsional baru untuk mengakomodasi bulk delete dari induk
type Props = {
    show: boolean;
    id?: number | null; // Diubah jadi opsional karena bulk delete tidak mengirim satu id
    isBulk?: boolean; // Flag penanda apakah ini hapus massal
    title?: string; // Teks judul dinamis
    message?: string; // Teks pesan dinamis
    confirmText?: string; // Teks tombol konfirmasi dinamis
    onClose: () => void;
    onConfirm?: () => void;
};

export default function DeleteModal({
    show,
    id,
    isBulk = false,
    title,
    message,
    confirmText,
    onClose,
    onConfirm,
}: Props) {
    // Pelindung modal: Jika bulk, tidak perlu mengecek kecukupan nilai 'id'
    if (!show) return null;
    if (!isBulk && !id) return null;

    function destroy() {
        if (onConfirm) {
            // Menjalankan fungsi confirmBulkDelete atau confirmDelete milik induk
            onConfirm();
        } else if (id) {
            // Fallback default jika tidak ada onConfirm khusus dari induk (untuk single delete)
            router.delete(route("station.print.destroy", id));
            onClose();
        }
    }

    return (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm duration-200">
            <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-200">
                {/* Gunakan teks kiriman induk atau gunakan teks default jika kosong */}
                <h3 className="text-xl font-bold text-gray-900">
                    {title || "Hapus file?"}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    {message ||
                        "Apakah Anda yakin ingin menghapus berkas ini? Tindakan ini tidak dapat dibatalkan."}
                </p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={destroy}
                        className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                        {confirmText || "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}
