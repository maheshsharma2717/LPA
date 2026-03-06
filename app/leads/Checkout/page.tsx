"use client";

import { useEffect, useState, Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface BreakdownItem {
  donor_name: string;
  lpa_type: 'health_and_welfare' | 'property_and_finance';
  opg_fee_pence: number;
  our_fee_pence: number;
  donors?: {
    application_id: string;
  };
  application_id?: string;
}

interface Fees {
  breakdown: BreakdownItem[];
  our_fee_pence: number;
  opg_fee_pence: number;
  total_pence: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("application_id");

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [fees, setFees] = useState<Fees | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        let appId = applicationId;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }
        const token = session.access_token;

        if (!appId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: apps } = await supabase
              .from("applications")
              .select("id")
              .eq("lead_id", user.id)
              .is("deleted_at", null)
              .order("created_at", { ascending: false })
              .limit(1);
            if (apps && apps.length > 0) appId = apps[0].id;
          }
        }

        if (!appId) {
          setError("Application ID not found");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/calculate-fees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ application_id: appId }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFees(data);
      } catch (err: unknown) {
        console.error("Error fetching fees:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load order details";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [applicationId, router]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ application_id: applicationId || fees?.breakdown?.[0]?.donors?.application_id || fees?.breakdown?.[0]?.application_id }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: unknown) {
      console.error("Payment error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to initiate payment";
      setError(errorMsg);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !fees) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center max-w-md">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b border-gray-100 py-4 px-6 sm:px-12 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zenco-blue rounded-full"></div>
            <span className="text-xl font-bold text-zenco-dark tracking-tight">
              LOGO<span className="text-zenco-blue">here</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="tel:08081693475" className="text-sm font-semibold text-gray-700 hidden sm:block">
            0808 169 3475
          </Link>
        </div>
      </header>

      <main className="grow bg-gray-50 py-10 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* LEFT: Order Summary */}
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#334a5e]">Your Order</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {fees?.breakdown?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-bold text-[#334a5e]">{item.donor_name}</p>
                      <p className="text-gray-500">
                        LPA {item.lpa_type === 'health_and_welfare' ? 'Health & Welfare' : 'Property & Finance'}
                      </p>
                      {item.opg_fee_pence > 0 && (
                        <p className="text-xs text-gray-400 mt-1">Includes OPG {item.opg_fee_tier} fee</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#334a5e]">£{((item.our_fee_pence + item.opg_fee_pence) / 100).toFixed(2)}</p>
                    </div>
                  </div>
                ))}

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>LPA Service Fees</span>
                    <span>£{((fees?.our_fee_pence??0 )/ 100).toFixed(2)}</span>
                  </div>
                  {fees!=null &&fees?.opg_fee_pence > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>OPG Registration Fees</span>
                      <span>£{((fees?.opg_fee_pence??0) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-lg font-black text-[#334a5e]">
                    <span>Total Cost</span>
                    <span>£{((fees?.total_pence??0 )/ 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/50 p-4 text-xs text-gray-500 text-center">
                Includes expert checking and premium postage to your address.
              </div>
            </div>

            <div className="bg-white border-3 border-cyan-400 rounded-2xl p-6 shadow-lg shadow-cyan-50">
              <div className="flex justify-between mb-4">
                <h3 className="font-extrabold text-[#334a5e] uppercase tracking-tight">Upgrade to Premium</h3>
                <span className="bg-cyan-100 text-cyan-600 text-[10px] font-bold px-2 py-1 rounded-full">RECOMMENDED</span>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-4">£25 per document</p>
              <ul className="space-y-2 mb-0">
                {['Freepost signed documents back', 'We submit to Government for you', 'Guaranteed first-time registration'].map((text, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-500 items-start">
                    <span className="text-green-500">✓</span> {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT: Payment */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#334a5e]">Payment</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-6 font-medium">
                We use strictly secure automated Stripe encryption. Your card details are never stored on our servers.
              </p>

              <div className="flex gap-3 mb-8">
                <div className="flex-1 h-12 border-2 border-cyan-500 bg-cyan-50 rounded-xl flex items-center justify-center">
                  <span className="text-cyan-600 font-bold text-sm">Debit / Credit Card</span>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-[#06b6d4] hover:bg-cyan-600 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-cyan-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {paying ? <CircularProgress size={24} color="inherit" /> : `Pay £${((fees?.total_pence??0 )  / 100).toFixed(2)} now`}
              </button>

              <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Refunds are available within 14 days if work has not yet commenced.
              </p>
            </div>

            {/* Help box */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[#334a5e] text-sm">We&apos;re here to help</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>Call 0800 888 6508</span>
                  </div>
                </div>
                <div className="bg-cyan-50 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-white border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">&copy; 2026 Zenco Legal. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
