"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterUser() {
  const router = useRouter();

  const [stage, setStage] = useState<"details" | "password">("details");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    marketing: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDetailsContinue = () => {
    if (!formData.name || !formData.email) return;
    setStage("password");
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Check if we have a session. If not, email confirmation might be required.
        const { data: { session } } = await supabase.auth.getSession();

        const nameParts = formData.name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        if (session) {
          const nameParts = formData.name.trim().split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

          const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: authData.user.id,
              firstName: firstName,
              lastName: lastName,
              preferredName: formData.name,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("API registration error:", errorData.error);
          }

          router.push("/leads");
        } else {
          setSuccess(true);
        }
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-blue-50">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zenco-dark mb-4">Check your email</h2>
          <p className="text-gray-600 mb-8">
            We've sent a confirmation link to <span className="font-semibold">{formData.email}</span>.
            Please verify your email to continue.
          </p>
          <Link
            href="/login"
            className="inline-block bg-zenco-blue text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className=" container mx-auto   py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="zen_logo.png" className="w-28" alt="" />
        </div>
      </header>

      {/* Main */}
      <main className="grow flex items-center justify-center p-6 sm:p-12">



        <div className=" max-w-2xl w-full bg-white rounded-2xl shadow-xl  p-8 sm:p-12  ">
          <img src="signup-email.png" className="w-40 mb-6 mx-auto " alt="" />

          {/*  NAME & EMAIL */}
          {stage === "details" && (
            <>
              <h2 className="text-2xl sm:text-4xl font-bold text-zenco-dark mb-2 text-center leading-tight" style={{ lineHeight: 1.2 }}>
                Let's start with the basics
              </h2>

              <p className="text-green-800 font-bold text-center mt-4 my-2" style={{ lineHeight: 1.5 }}>
                People in your situation usually finish their documents in 15 minutes
              </p>

              <div className="row w-[75%]  space-y-6 mx-auto">
                <h2 className="font-bold text-xl my-4"> Sign Up with Email</h2>

                {/* Name */}
                <div className="row ">
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    Your preferred name e.g. Jim
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-sm border-2 border-gray-300 px-4 py-3  focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-sm border-2 border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                  />
                </div>

                {/* Marketing Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={formData.marketing}
                    onChange={(e) =>
                      setFormData({ ...formData, marketing: e.target.checked })
                    }
                    className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                  />
                  <p className="text-sm  text-gray-600">
                    Email me occasional tips, offers and updates from Zenco
                  </p>
                </div>

                {/* Continue */}
                <button
                  onClick={handleDetailsContinue}
                  className="w-full bg-[#08B9ED] text-white cursor-pointer py-3 rounded-sm font-semibold hover:opacity-90 transition"
                >
                  Continue
                </button>

                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-gray-200"></div>
                  <span className="shrink mx-4 text-sm text-gray-400 font-medium">or</span>
                  <div className="grow border-t border-gray-200"></div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/leads`,
                        },
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      console.error("Google sign-up error:", err);
                      setError(err.message);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-sm font-semibold text-sm hover:bg-gray-50 transition"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Sign up with Google
                </button>

                <p className="text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-zenco-blue font-medium">
                    Log in
                  </Link>
                </p>

                <div className="text-xs text-gray-500 text-center mt-6">
                  <p className="font-semibold mb-1">Privacy guaranteed</p>
                  <p>
                    We take your privacy seriously. We will never sell your data,
                    and our security ensures your data is completely confidential.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — PASSWORD */}
          {stage === "password" && (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zenco-dark mb-4 leading-tight">
                Create password
              </h2>

              <p className="text-gray-600 mb-8">
                You can come back later if you don't have time to finish your documents now
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter password (minimum 8 characters)
                  </label>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[38px] text-gray-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Continue */}
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-zenco-blue text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Continue"}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By creating account you agree to the{" "}
                  <Link href="/terms" className="text-zenco-blue underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-zenco-blue underline">
                    Privacy Policy
                  </Link>.
                </p>

                <button
                  onClick={() => setStage("details")}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Back to details
                </button>
              </div>
            </>
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
