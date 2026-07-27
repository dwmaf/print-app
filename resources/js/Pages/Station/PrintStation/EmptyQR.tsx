import React from "react";

type Props = {
    qrCode: string | null;
    showQr: boolean;
    stationName: string;
    onToggleQr: () => void;
};

export default function EmptyQR({
    qrCode,
    showQr,
    stationName,
    onToggleQr,
}: Props) {
    if (!qrCode) {
        return (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-4 font-medium text-yellow-700">
                QR Code untuk {stationName} belum dibuat
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-xl bg-white p-4 shadow">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">{stationName}</h3>
                {/* Tombol untuk menyembunyikan/menampilkan QR sesuai state showQr */}
                <button
                    type="button"
                    onClick={onToggleQr}
                    className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
                >
                    {showQr ? "Sembunyikan" : "Tampilkan QR"}
                </button>
            </div>

            {/* Tampilkan QR hanya jika state showQr bernilai true */}
            {showQr ? (
                <div className="flex flex-col items-center">
                    <div className="mb-4 text-sm text-gray-500">
                        Scan QR untuk upload file
                    </div>
                    <div
                        className="flex h-64 w-full items-center justify-center rounded-lg bg-gray-50 p-2"
                        dangerouslySetInnerHTML={{ __html: qrCode }}
                    />
                </div>
            ) : (
                <div className="rounded-lg border border-dashed bg-gray-50 py-8 text-center text-sm text-gray-400">
                    QR Code disembunyikan. Klik tombol di atas untuk
                    menampilkan.
                </div>
            )}
        </div>
    );
}
