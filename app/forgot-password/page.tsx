"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (resetError) throw resetError;

            setSuccessMessage("Password reset instructions have been sent to your email.");
            setEmail("");
        } catch (err: unknown) {
            console.error("Reset password error:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="max-w-7xl container mx-auto py-4 px-6 sm:px-12 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="zen_logo.png" className="w-20" alt="Zenco Logo" />
                </Link>
            </header>

            {/* Main */}
            <main className="grow flex items-center justify-center">
                <div className="max-w-lg w-full p-5 sm:p-12">
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-3xl font-bold text-zenco-dark text-center">
                            Forgot Password
                        </h2>
                        <p className="text-[#3A3A3C] mt-2 text-xl font-medium text-center">
                            Enter your email to receive a password reset link
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#08B9ED] text-white py-3 rounded font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>

                        <p className="text-sm text-center text-[#212529] mt-6">
                            Remember your password?{" "}
                            <Link href="/login" className="text-md text-center text-[#212529] cursor-pointer hover:underline">
                                Log in
                            </Link>
                        </p>
                    </form>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-6 text-center text-gray-400 text-sm">
                <p>Your details are protected by 256-bit encryption</p>
            </footer>
        </div>
    );
}
