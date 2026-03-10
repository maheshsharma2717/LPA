"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface ApplicationDetails {
  id: string;
  status: string;
  total_pence: number;
  paid_at: string | null;
  created_at: string;
  leads: {
    first_name: string;
    last_name: string;
    email?: string;
    mobile: string;
    address_line_1: string;
    city: string;
    postcode: string;
  };
  donors: any[];
  attorneys: any[];
  payments: any[];
}

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApplicationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        const functionUrl = `/api/admin-application-details`;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError;
          try {
            parsedError = JSON.parse(errorText);
          } catch (e) {
            parsedError = errorText;
          }
          
          let statusStr = "Unknown error";
          if (typeof parsedError === 'object' && parsedError !== null) {
            statusStr = parsedError.error || parsedError.message || JSON.stringify(parsedError);
          } else if (typeof parsedError === 'string') {
            statusStr = parsedError;
          }

          setError(`Error fetching details: ${statusStr}`);
        } else {
          const responseData = await response.json();
          setData(responseData.application);
        }
      } catch (err: unknown) {
        setError((err as Error).message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, id]);

  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format((pence || 0) / 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#08B9ED]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/admin" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zen_logo.png" className="w-20" alt="Zenco Logo" />
            <span className="ml-4 font-bold text-gray-700 border-l pl-4 border-gray-300">Admin Area</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-[#08B9ED] transition-colors mr-4">
              Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-[#08B9ED] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl shadow-sm text-center max-w-lg mx-auto mt-10">
             <h2 className="text-xl font-semibold mb-2">Error</h2>
             <p>{error}</p>
             <Link href="/admin" className="mt-6 inline-block bg-[#08B9ED] text-white px-6 py-2 rounded font-medium hover:opacity-90 transition-opacity">
               Return Home
             </Link>
          </div>
        ) : data ? (
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
                <span className={`px-4 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full 
                             ${data.status === 'paid' ? 'bg-green-100 text-green-800' : 
                               data.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                               data.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                               'bg-yellow-100 text-yellow-800'}`}>
                             {data.status.toUpperCase()}
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Lead Info */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Lead Information</h2>
                    {data.leads ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{data.leads.first_name} {data.leads.last_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Contact</p>
                                <p className="font-medium">{data.leads.mobile}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">{data.leads.address_line_1}</p>
                                <p className="font-medium">{data.leads.city}, {data.leads.postcode}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No lead details found.</p>
                    )}
                 </div>

                 {/* Application Info */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Application Summary</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Application ID</p>
                            <p className="font-mono text-sm">{data.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Created At</p>
                            <p className="font-medium">{new Date(data.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Value</p>
                            <p className="font-medium">{formatCurrency(data.total_pence)}</p>
                        </div>
                        {data.paid_at && (
                            <div>
                                <p className="text-sm text-gray-500">Paid At</p>
                                <p className="font-medium">{new Date(data.paid_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                 </div>
             </div>

             {/* Donors & LPAs section */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
                 <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Donors & LPAs</h2>
                 {data.donors && data.donors.length > 0 ? (
                     <div className="space-y-6">
                        {data.donors.map((donor, idx) => (
                           <div key={donor.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                               <h3 className="font-bold text-lg mb-2">Donor {idx + 1}: {donor.first_name} {donor.last_name}</h3>
                               <p className="text-sm text-gray-600 mb-4">Relationship: {donor.relationship_to_lead}</p>
                               
                               {donor.lpa_documents && donor.lpa_documents.length > 0 ? (
                                   <div className="space-y-4">
                                       <h4 className="font-semibold text-gray-800">LPA Documents</h4>
                                       {donor.lpa_documents.map((doc: any) => (
                                           <div key={doc.id} className="bg-white p-4 rounded border border-gray-200 shadow-sm text-sm">
                                               <div className="flex justify-between items-start mb-2">
                                                   <span className="font-bold text-gray-900">{doc.lpa_type.replace(/_/g, ' ').toUpperCase()}</span>
                                                   <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{doc.status}</span>
                                               </div>
                                               <p>Attorney Decisions: {doc.attorney_decision_type ? doc.attorney_decision_type.replace(/_/g, ' ') : 'N/A'}</p>
                                           </div>
                                       ))}
                                   </div>
                               ) : (
                                   <p className="text-sm text-gray-500 italic">No LPA documents for this donor.</p>
                               )}
                           </div>
                        ))}
                     </div>
                 ) : (
                     <p className="text-gray-500 italic">No donors found for this application.</p>
                 )}
             </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}
