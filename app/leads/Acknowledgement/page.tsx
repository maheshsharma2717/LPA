"use client";

import { useEffect, useState, Suspense } from "react";
import { CircularProgress, Box, FormControl, Select, MenuItem } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AcknowledgementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [finishedDonor, setFinishedDonor] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nextDonor, setNextDonor] = useState<any>(null);
  const [isDone, setIsDone] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const finishedIndex = parseInt(searchParams.get("finishedIndex") || "0");
  const nextIndexParam = searchParams.get("nextIndex");
  const nextIndex = nextIndexParam ? parseInt(nextIndexParam) : null;
  const doneParam = searchParams.get("done");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("User not authenticated");
          return;
        }

        // Use limit(1) instead of single() to be safer if multiple draft apps exist
        const { data: apps, error: appError } = await supabase
          .from("applications")
          .select("id")
          .eq("lead_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);

        if (appError) throw appError;
        if (!apps || apps.length === 0) {
          setError("No active application found");
          return;
        }

        const application = apps[0];

        const { data: donors, error: donorsError } = await supabase
          .from("donors")
          .select("*")
          .eq("application_id", application.id)
          .order("created_at", { ascending: true });

        if (donorsError) throw donorsError;

        if (donors) {
          console.log("Donors found:", donors.length, donors);
          setFinishedDonor(donors[finishedIndex]);

          // Debugging: if nextIndex is provided but out of bounds, check why
          if (nextIndex !== null) {
            if (nextIndex < donors.length) {
              setNextDonor(donors[nextIndex]);
            } else {
              console.warn(`nextIndex ${nextIndex} is out of bounds for donors array of length ${donors.length}`);
            }
          }
        }

        if (doneParam === "true") {
          setIsDone(true);
        }
      } catch (err: unknown) {
        console.error("Error fetching acknowledgement data:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load donor information";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [finishedIndex, nextIndex, doneParam]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" p={4} textAlign="center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-zenco-blue text-white px-6 py-2 rounded-lg font-bold"
        >
          Retry
        </button>
      </Box>
    );
  }

  // ───── PHASE 2: All donors done — "Almost There! Complete your order..." ─────
  // Only show this if explicitly done OR if we have no intent to go to a next person
  if (isDone || (nextIndexParam === null && !nextDonor && !loading)) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="w-full border-b border-gray-100 py-4 px-6 sm:px-12 flex justify-between items-center bg-white sticky top-0 z-50">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zen_logo.png" className="w-20" alt="Zenco Logo" />
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-cyan-500 transition-colors">Home</Link>
            <Link href="#" className="hover:text-cyan-500 transition-colors">My Messages</Link>
            <Link href="#" className="hover:text-cyan-500 transition-colors">Help</Link>
            <Link href="#" className="hover:text-cyan-500 transition-colors">My Account</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
              className="hover:text-cyan-500 transition-colors"
            >
              Logout
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <main className="grow flex flex-col items-center p-6 sm:p-12">
          <div className="max-w-4xl w-full space-y-6">
            {/* Support card + Help */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Illustration */}
              <div className="hidden md:block w-36 flex-shrink-0">
                <div className="w-36 h-28 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              {/* Support box */}
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#334a5e] text-lg">We&apos;re here to help</h3>
                    <p className="text-gray-500 text-sm mt-1">Need help with your payment?</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span>Call us on <u className="text-cyan-500 font-semibold">0800 888 6508</u></span>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-cyan-600">Z</div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">L</div>
                    <div className="w-8 h-8 bg-teal-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-teal-600">S</div>
                  </div>
                </div>
              </div>

              {/* Help dropdown */}
              <div className="md:w-48">
                <FormControl fullWidth>
                  <Select
                    value="HELP"
                    sx={{ fontWeight: 600, color: "#06b6d4", borderRadius: "8px" }}
                  >
                    <MenuItem value="HELP" sx={{ fontWeight: 600, color: "#06b6d4" }}>NEED HELP?</MenuItem>
                    <MenuItem value="SUPPORT">Contact Support</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-[#334a5e]">
              Almost There! Complete your order...
            </h1>

            {/* Steps */}
            <div className="space-y-6">
              {/* Step 1 — Create your documents (COMPLETED) */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ✓
                  </div>
                  <div className="w-0.5 h-16 bg-gray-200 mt-1"></div>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-[#334a5e] text-lg mb-2">Create your documents</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Congratulations! You&apos;ve finished creating your Lasting Power of Attorney documents.
                    Now you just need to pay to have the documents sent out.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        // 1. Get application
                        const { data: apps } = await supabase
                          .from("applications")
                          .select("id")
                          .eq("lead_id", user.id)
                          .is("deleted_at", null)
                          .order("created_at", { ascending: false })
                          .limit(1);

                        const app = apps?.[0];

                        if (app) {
                          // 2. Mark all LPAs as complete as a precaution
                          const { data: donors } = await supabase
                            .from("donors")
                            .select("id")
                            .eq("application_id", app.id);

                          if (donors) {
                            const donorIds = donors.map(d => d.id);
                            await supabase
                              .from("lpa_documents")
                              .update({ status: 'complete' })
                              .in("donor_id", donorIds);
                          }

                          // 3. Update application status
                          await supabase
                            .from("applications")
                            .update({ status: "complete" })
                            .eq("id", app.id);

                          router.push(`/leads/Checkout?application_id=${app.id}`);
                        }
                      } catch (err) {
                        console.error("Error transitioning to checkout:", err);
                        router.push("/leads/Checkout");
                      }
                    }}
                    className="bg-[#06b6d4] hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-all active:scale-95 shadow-lg w-full text-center text-lg"
                  >
                    Go to checkout
                  </button>
                  <p
                    className="text-center text-cyan-500 text-sm mt-3 cursor-pointer hover:underline font-medium"
                    onClick={() => router.push(`/leads?currentDonorIndex=${finishedIndex}&step=10`)}
                  >
                    Review documents again
                  </p>
                </div>
              </div>

              {/* Step 2 — Expert check */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                    2
                  </div>
                  <div className="w-0.5 h-10 bg-gray-200 mt-1"></div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-gray-400 text-lg">Expert check</h3>
                  <p className="text-gray-400 text-sm">Our experts check your documents.</p>
                </div>
              </div>

              {/* Step 3 — Print and send */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                    3
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-gray-400 text-lg">Print and send</h3>
                  <p className="text-gray-400 text-sm">We print and send your documents to you along with help sheets on how to sign.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ───── PHASE 1: "Continue to next person" transition screen ─────
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full border-b border-gray-100 py-4 px-6 sm:px-12 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zen_logo.png" className="w-20" alt="Zenco Logo" />
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-cyan-500 transition-colors">Home</Link>
          <Link href="#" className="hover:text-cyan-500 transition-colors">My Messages</Link>
          <Link href="#" className="hover:text-cyan-500 transition-colors">Help</Link>
          <Link href="#" className="hover:text-cyan-500 transition-colors">My Account</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="hover:text-cyan-500 transition-colors"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="grow flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* LPA Icon */}
          <div className="mx-auto w-24 h-24 bg-cyan-50 rounded-2xl flex items-center justify-center border border-cyan-100">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[10px] font-bold text-cyan-600 mt-1">LPA</p>
            </div>
          </div>

          <p className="text-xl text-gray-700 leading-relaxed">
            You have now finished the Lasting Power of Attorney for{" "}
            <span className="text-cyan-500 font-bold underline">
              {finishedDonor ? `${finishedDonor.first_name} ${finishedDonor.last_name}` : "the donor"}
            </span>
            , next we will move on and get the documents for{" "}
            <span className="text-cyan-500 font-bold underline">
              {nextDonor ? `${nextDonor.first_name} ${nextDonor.last_name}` : "the next person"}
            </span>
            {" "}done.
          </p>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 font-bold flex items-center gap-2 hover:text-[#334a5e] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <u>Back</u>
            </button>

            <button
              onClick={() => router.push(`/leads?currentDonorIndex=${nextIndex}`)}
              className="bg-[#06b6d4] hover:bg-cyan-600 text-white font-bold py-3 px-10 rounded-lg transition-all active:scale-95 shadow-lg text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Acknowledgement() {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    }>
      <AcknowledgementContent />
    </Suspense>
  );
}
