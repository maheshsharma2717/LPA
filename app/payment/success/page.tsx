"use client";

import Link from "next/link";
import { CheckCircle } from "@mui/icons-material";

export default function PaymentSuccess() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                    <CheckCircle sx={{ fontSize: 48 }} />
                </div>

                <h1 className="text-3xl font-extrabold text-[#334a5e] mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-8">
                    Thank you for your order. We have received your payment and are now processing your documents.
                </p>

                <div className="space-y-4 text-left bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
                    <h2 className="font-bold text-[#334a5e] mb-3">What happens next?</h2>
                    <div className="flex gap-3 text-sm">
                        <div className="font-bold text-cyan-500">1.</div>
                        <div className="text-gray-600">Our experts will review your documents for accuracy.</div>
                    </div>
                    <div className="flex gap-3 text-sm">
                        <div className="font-bold text-cyan-500">2.</div>
                        <div className="text-gray-600">Once approved, we will print and post your documents to you.</div>
                    </div>
                    <div className="flex gap-3 text-sm">
                        <div className="font-bold text-cyan-500">3.</div>
                        <div className="text-gray-600">Follow the included instructions to sign and return them.</div>
                    </div>
                </div>

                <Link
                    href="/leads"
                    className="block w-full bg-[#06b6d4] hover:bg-cyan-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-100 active:scale-95"
                >
                    Return to Dashboard
                </Link>
            </div>

            <p className="mt-8 text-sm text-gray-400">
                If you have any questions, please call us on <span className="font-bold">0800 888 6508</span>
            </p>
        </div>
    );
}
