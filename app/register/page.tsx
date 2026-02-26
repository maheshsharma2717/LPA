"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";

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
    debugger;
    try {
      const {data: authData, error: authError} = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/leads`,
        }

      });

      if (authError) throw authError;

      if (authData.user) {
        // Check if we have a session. If not, email confirmation might be required.
        const {
          data: {session},
        } = await supabase.auth.getSession();

        if (session) {
          const nameParts = formData.name.trim().split(" ");
          const firstName = nameParts[0];
          const lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
          const token = session.access_token;

          const response = await fetch("/api/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
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
            router.push("/leads");
          } else {
            setSuccess(true);
          }

        } else {
          setSuccess(true);
        }
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-blue-50">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#3a3a3c] mb-4">
            Check your email
          </h2>
          <p className="text-gray-600 mb-8">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-semibold">{formData.email}</span>. Please
            verify your email to continue.
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
      <header className=" container mx-auto py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="zen_logo.png" className="w-28" alt="" />
        </div>
      </header>

      {/* Main */}
      <main className="grow flex items-center justify-center p-6 sm:p-12">
        <div className="xl:w-1/2 p-8 sm:p-12  ">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="signup-email.png" className="w-40 mb-6 mx-auto " alt="" />

          {/*  NAME & EMAIL */}
          {stage === "details" && (
            <>
              <h2
                className="text-2xl sm:text-4xl font-bold text-[#3a3a3c] mb-2 text-center leading-tight"
                style={{lineHeight: 1.2}}
              >
                Let&apos;s start with the basics
              </h2>

              <p
                className="text-[#04724e] text-center font-medium mt-4 text-lg"
                style={{lineHeight: 1.5}}
              >
                People in your situation usually finish their documents in 15
                minutes
              </p>

              <div className="max-w-lg w-full sm:p-12 space-y-5 mx-auto">
                <h2 className="font-bold text-xl mb-4"> Sign up with Email</h2>

                {/* Name */}
                <div className="row ">
                  <label className="block text-md font-medium text-[#3A3A3C] mb-2">
                    Your preferred name e.g. Jim
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({...formData, name: e.target.value})
                    }
                    className="w-full rounded-sm border-2 bg-white border-[#ced4da] px-4 py-3 focus:border-0 focus:ring-2 focus:ring-[#86b7fe] focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-md font-medium text-[#3A3A3C] mb-2">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({...formData, email: e.target.value})
                    }
                    className="w-full rounded-sm border-2 bg-white border-[#ced4da] px-4 py-3 focus:border-0 focus:ring-2 focus:ring-[#86b7fe] focus:outline-none"
                  />
                </div>

                {/* Marketing Checkbox */}
                <div className="flex justify-start items-center gap-3">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={formData.marketing}
                    onChange={(e) =>
                      setFormData({...formData, marketing: e.target.checked})
                    }
                    className="bordern rounded-sm p-7 w-5  h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                  />

                  <p className="text-sm text-gray-600">
                    Email me occasional tips, offers and updates from Zenco
                  </p>
                </div>

                {/* Continue */}
                <button
                  onClick={handleDetailsContinue}
                  className="w-full bg-[#08B9ED] text-white cursor-pointer py-3 rounded-sm font-semibold hover:opacity-90 hover:filter:brightness-[90%] transition"
                >
                  Continue
                </button>

                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-gray-200"></div>
                  <span className="shrink mx-4 text-sm text-gray-400 font-medium">
                    or
                  </span>
                  <div className="grow border-t border-gray-200"></div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const {error} = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/leads`,
                        },
                      });
                      if (error) throw error;
                    } catch (err: unknown) {
                      console.error("Google sign-up error:", err);
                      setError(err instanceof Error ? err.message : "An error occurred");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-sm font-semibold text-sm hover:bg-gray-50 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    className="w-5 h-5"
                    alt="Google"
                  />
                  Sign up with Google
                </button>
                <p className="text-md text-center text-[#212529]">
                  Already have an account?
                  <Link href="/login">
                    <u> Log in</u>
                  </Link>
                </p>

              </div>
              <div className="text-[#3A3A3C] text-center">
                <div className="flex justify-center items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    width="24"
                    height="24"
                    fill="currentColor"
                    className="mb-2"
                  >
                    <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z" />
                  </svg>
                  <p className=" text-lg font-medium mb-1">
                    Privacy guaranteed
                  </p>
                </div>

                <p>
                  We take your privacy seriously. We will never sell your data,
                  and our security ensures your data is completely confidential.
                </p>
              </div>
            </>
          )}

          {/* STEP 2 — PASSWORD */}
          {stage === "password" && (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3a3a3c] mb-4 leading-tight">
                Create password
              </h2>

              <p className="text-gray-600 mb-8">
                You can come back later if you don&apos;t have time to finish your
                documents now
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#3A3A3C] mb-2">
                    Enter password (minimum 8 characters)
                  </label>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({...formData, password: e.target.value})
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-9.5 text-gray-500"
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
                  </Link>
                  .
                </p>

                <button
                  onClick={() => setStage("details")}
                  className="w-full text-sm text-gray-500 hover:text-[#3A3A3C] font-medium"
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
