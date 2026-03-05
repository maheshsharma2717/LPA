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
        mfaCode: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // MFA state
    const [requiresMfa, setRequiresMfa] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);

    // Enroll state (if they are an admin but haven't enrolled yet)
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [qrCodeDataUri, setQrCodeDataUri] = useState<string | null>(null);
    const [enrollSecret, setEnrollSecret] = useState<string | null>(null);

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

            // Check if MFA is required or can be enrolled
            const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;

            const totpFactor = factorsData.totp[0];

            if (totpFactor && totpFactor.status === 'verified') {
                // MFA is already enrolled and verified. Initiate challenge.
                const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                    factorId: totpFactor.id,
                });
                
                if (challengeError) throw challengeError;

                setMfaFactorId(totpFactor.id);
                setMfaChallengeId(challengeData.id);
                setRequiresMfa(true);
                setLoading(false);
                return; // Stop here, wait for MFA code
            } else if (data.user?.app_metadata?.role === 'admin' || formData.email.includes('admin')) {
                // If the user *needs* MFA (e.g. they are an admin) but hasn't enrolled, let's offer enrollment.
                // We assume anyone accessing the admin panel needs this. For now we will allow anyone to enroll if they want,
                // but admins MUST enroll to access /admin anyway. 
                const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
                    factorType: 'totp',
                    issuer: 'Zenco LPA',
                    friendlyName: 'Admin Authenticator'
                });

                if (enrollError) throw enrollError;

                setMfaFactorId(enrollData.id);
                setQrCodeDataUri(enrollData.totp.qr_code);
                setEnrollSecret(enrollData.totp.secret);
                setIsEnrolling(true);
                setLoading(false);
                return;
            }

            if (data.session) {
                router.push("/leads");
            }
        } catch (err: unknown) {
            console.error("Login error:", err);
            setError(err instanceof Error ? err.message : "An error occurred during login");
            setLoading(false);
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!mfaFactorId || !mfaChallengeId) {
                throw new Error("Missing MFA challenge data.");
            }

            const { data, error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: mfaChallengeId,
                code: formData.mfaCode,
            });

            if (verifyError) throw verifyError;

            // If we are here, AAL2 is achieved!
            router.push("/leads"); // or /admin based on preference. Let's go to leads by default like before.
        } catch (err: unknown) {
             console.error("MFA Verify error:", err);
             setError(err instanceof Error ? err.message : "Invalid authentication code");
        } finally {
            setLoading(false);
        }
    };

    // For enrolling for the very first time
    const handleEnrollMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!mfaFactorId) throw new Error("Missing MFA factor ID for enrollment.");

            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaFactorId,
            });

            if (challengeError) throw challengeError;

            const { data, error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: challengeData.id,
                code: formData.mfaCode,
            });

            if (verifyError) throw verifyError;

             // Enrollment complete!
             router.push("/leads");
        } catch (err: unknown) {
            console.error("MFA Enroll error:", err);
            setError(err instanceof Error ? err.message : "Invalid authentication code");
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
        } catch (err: unknown) {
            console.error("Google login error:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const resetLoginState = () => {
        setRequiresMfa(false);
        setIsEnrolling(false);
        setMfaFactorId(null);
        setMfaChallengeId(null);
        setQrCodeDataUri(null);
        setEnrollSecret(null);
        setFormData(prev => ({ ...prev, mfaCode: "" }));
        setError(null);
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="signup-email.png" className="w-40 mb-6 mx-auto " alt="" />
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-3xl font-bold text-zenco-dark text-center">
                            {requiresMfa || isEnrolling ? "Two-Factor Authentication" : "Welcome back"}
                        </h2>
                        <p className="text-[#3A3A3C] mt-2 text-md font-medium text-center">
                            {requiresMfa 
                                ? "Enter the code from your authenticator app to continue." 
                                : isEnrolling 
                                    ? "Scan the QR code with your authenticator app (like Google Authenticator) and enter the code below to enroll."
                                    : "Log in to your account"}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {!requiresMfa && !isEnrolling && (
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
                                    className="w-full rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
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
                                    className="w-full rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#08B9ED] text-white py-3 rounded font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
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
                                className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl font-semibold text-sm cursor-pointer hover:bg-gray-50 transition"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                Continue with Google
                            </button>

                            <p className="text-sm text-center text-[#212529] mt-6">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="text-md text-center text-[#212529]  cursor-pointer">
                                <u>Sign up</u>  
                                </Link>
                            </p>
                        </form>
                    )}

                    {/* MFA Verification Form */}
                    {requiresMfa && (
                         <form onSubmit={handleVerifyMfa} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Authenticator Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoComplete="one-time-code"
                                    value={formData.mfaCode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mfaCode: e.target.value })
                                    }
                                    className="w-full text-center tracking-[0.5em] text-lg rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                             <button
                                type="submit"
                                disabled={loading || formData.mfaCode.length < 6}
                                className="w-full bg-[#08B9ED] text-white py-3 rounded font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? "Verifying..." : "Verify Login"}
                            </button>
                            <button
                                type="button"
                                onClick={resetLoginState}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded font-semibold hover:bg-gray-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                         </form>
                    )}

                     {/* MFA Enrollment Form */}
                     {isEnrolling && (
                         <form onSubmit={handleEnrollMfa} className="space-y-6 flex flex-col items-center">
                            {qrCodeDataUri && (
                                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCodeDataUri} alt="QR Code" className="w-48 h-48 mx-auto" />
                                </div>
                            )}
                            {enrollSecret && (
                                <div className="text-center w-full mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Manual Entry Code:</p>
                                    <code className="bg-gray-100 px-3 py-1 rounded text-sm text-zenco-dark">{enrollSecret}</code>
                                </div>
                            )}

                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                    Authenticator Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoComplete="one-time-code"
                                    value={formData.mfaCode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mfaCode: e.target.value })
                                    }
                                    className="w-full text-center tracking-[0.5em] text-lg rounded border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-[#08B9ED] focus:outline-none"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                             <button
                                type="submit"
                                disabled={loading || formData.mfaCode.length < 6}
                                className="w-full bg-[#08B9ED] text-white py-3 rounded font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? "Enrolling..." : "Complete Setup & Login"}
                            </button>
                            <button
                                type="button"
                                onClick={resetLoginState}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded font-semibold hover:bg-gray-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                         </form>
                    )}


                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-6 text-center text-gray-400 text-sm">
                <p>Your details are protected by 256-bit encryption</p>
            </footer>
        </div>
    );
}
