"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        // Check if the user is authenticated (they should be when clicking the reset link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Not authenticated, but might be trying to load the page before session is established from hash
                // We'll let Supabase handle the hash fragment processing automatically.
                // If they truly have no session and no hash, they probably shouldn't be on this page.
                
                // For a more robust implementation, you might want to redirect them to login if there's no #access_token in the URL.
                if (!window.location.hash.includes("access_token")) {
                     // router.push("/login"); // Optional: strict redirect
                }
            }
        };
        
        checkSession();
        
        // Listen for auth state changes, especially important for when the hash fragment is processed
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                console.log("Password recovery mode active");
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setMessage("Password updated successfully! Redirecting...");
            
            // Redirect to login or dashboard after a short delay
            setTimeout(() => {
                router.push("/login"); // Or to "/leads"
            }, 2000);

        } catch (err: unknown) {
            console.error("Update password error:", err);
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
                            Set New Password
                        </h2>
                        <p className="text-[#3A3A3C] mt-2 text-xl font-medium text-center">
                            Enter your new password below
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}
                    
                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full bg-[#08B9ED] text-white py-3 rounded font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
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
