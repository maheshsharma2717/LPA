"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (data.session) {
                router.push("/leads");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google'
            });
            if (error) throw error;
        } catch (err: any) {
            console.error("Google login error:", err);
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="max-w-7xl container mx-auto py-4 px-6 sm:px-12 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    <img src="zen_logo.png" className="w-20" alt="Zenco Logo" />
                </Link>
            </header>

            {/* Main */}
            <main className="grow flex items-center justify-center p-6 sm:p-12">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-blue-50">
                      <img src="signup-email.png" className="w-40 mb-6 mx-auto " alt="" />
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-3xl font-bold text-zenco-dark text-center">
                            Welcome back
                        </h2>
                        <p className="text-gray-500 mt-2">Log in to your account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-zenco-blue hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#08B9ED] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? "Logging in..." : "Log in"}
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="grow border-t border-gray-200"></div>
                            <span className="shrink mx-4 text-sm text-gray-400 font-medium">or</span>
                            <div className="grow border-t border-gray-200"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                            Continue with Google
                        </button>

                        <p className="text-sm text-center text-gray-600 mt-6">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-zenco-blue font-medium hover:underline">
                                Sign up
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
