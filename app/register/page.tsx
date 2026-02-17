"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterUser() {

  const routePage = useRouter();

  const [stage, setStage] = useState<"details" | "password">("details");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    marketing: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleDetailsContinue = () => {
    if (!formData.name || !formData.email) return;
    setStage("password");
  };

  const handleRegister = () => {
    // console.log("Final Data:", formData);
    // Later: call API
    routePage.push("/details");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zenco-blue rounded-full"></div>
          <span className="text-lg font-bold text-zenco-dark tracking-tight">
            ZENCO<span className="text-zenco-blue">LEGAL</span>
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 sm:p-12 border border-blue-50">

          {/*  NAME & EMAIL */}
          {stage === "details" && (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zenco-dark mb-4 leading-tight">
                Let's start with the basics
              </h2>

              <p className="text-gray-600 mb-8">
                People in your situation usually finish their documents in 15 minutes
              </p>

              <div className="space-y-6">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your preferred name e.g. Jim
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                  />
                </div>

                {/* Marketing Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.marketing}
                    onChange={(e) =>
                      setFormData({ ...formData, marketing: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600">
                    Email me occasional tips, offers and updates from Zenco
                  </p>
                </div>

                {/* Continue */}
                <button
                  onClick={handleDetailsContinue}
                  className="w-full bg-zenco-blue text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Continue
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
                  className="w-full bg-zenco-blue text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Continue
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
