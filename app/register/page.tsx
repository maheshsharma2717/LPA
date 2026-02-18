"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        
        const nameParts = formData.name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const { error: leadError } = await supabase.from("leads").insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName || "Unknown",
          preferred_name: formData.name,
        });

        if (leadError) throw leadError;

        routePage.push("/details");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className="max-w-7xl container mx-auto   py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
         <img src="zen_logo.png" className="w-20" alt="" />
        </div>
      </header>

      {/* Main */}
      <main className="grow flex items-center justify-center p-6 sm:p-12">
        

        
        <div className=" max-w-2xl w-full bg-transparent  p-8 sm:p-12  ">
        <img src="signup-email.png" className="w-40 mb-6 mx-auto " alt=""  />

          {/*  NAME & EMAIL */}
          {stage === "details" && (
            <>
              <h2 className="text-2xl sm:text-4xl font-bold text-zenco-dark mb-2 text-center leading-tight" style={{lineHeight: 1.2}}>
                Let's start with the basics
              </h2>

              <p className="text-green-800 font-bold text-center mt-4 my-2" style={{lineHeight: 1.5}}>
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
