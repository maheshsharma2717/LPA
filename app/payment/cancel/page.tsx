"use client";

import Link from "next/link";
import { ErrorOutline } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CancelContent() {
    const searchParams = useSearchParams();
    const applicationId = searchParams.get("application_id");

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                    <ErrorOutline sx={{ fontSize: 48 }} />
                </div>

                <h1 className="text-3xl font-extrabold text-[#334a5e] mb-2">Payment Cancelled</h1>
                <p className="text-gray-600 mb-8">
                    The payment process was cancelled and you haven&apos;t been charged. You can try again when you&apos;re ready.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href={applicationId ? `/leads/Checkout?application_id=${applicationId}` : "/leads/Checkout"}
                        className="block w-full bg-[#06b6d4] hover:bg-cyan-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-100 active:scale-95"
                    >
                        Try Payment Again
                    </Link>

                    <Link
                        href="/leads"
                        className="block w-full bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold py-4 rounded-xl transition-all active:scale-95"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>

            <p className="mt-8 text-sm text-gray-400">
                If you&apos;re having trouble paying, please call us on <span className="font-bold">0800 888 6508</span>
            </p>
        </div>
    );
}

export default function PaymentCancel() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenco-blue"></div>
            </div>
        }>
            <CancelContent />
        </Suspense>
    );
}
