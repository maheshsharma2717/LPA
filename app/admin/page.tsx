"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface DashboardData {
  total_applications: number;
  by_status: Record<string, number>;
  revenue_pence: number;
  conversion_rate: number;
  recent_applications: {
    id: string;
    status: string;
    total_pence: number;
    paid_at: string | null;
    created_at: string;
    leads: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First check if the user is even logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        // Call our Edge Function
        // The edge function itself will verify the JWT and enforce the admin role logic
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-dashboard`;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError;
          try {
            parsedError = JSON.parse(errorText);
          } catch (e) {
            parsedError = errorText;
          }
          
          console.error("Dashboard HTTP Error:", response.status, parsedError);
          
          let statusStr = "Unknown error";
          if (typeof parsedError === 'object' && parsedError !== null) {
            statusStr = parsedError.error || parsedError.message || JSON.stringify(parsedError);
          } else if (typeof parsedError === 'string') {
            statusStr = parsedError;
          }

          if (response.status === 401 || response.status === 403 || statusStr.includes('MFA') || statusStr.includes('Admin')) {
            setError(`Access Denied: ${statusStr}`);
          } else {
            setError(`Error fetching dashboard (${response.status}): ${statusStr}`);
          }
        } else {
          const responseData = await response.json();
          setData(responseData);
        }

      } catch (err: unknown) {
        console.error("Dashboard error:", err);
        setError((err as Error).message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(pence / 100);
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
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zen_logo.png" className="w-20" alt="Zenco Logo" />
            <span className="ml-4 font-bold text-gray-700 border-l pl-4 border-gray-300">Admin Area</span>
          </Link>
          <div className="flex items-center gap-4">
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
             <Link href="/" className="mt-6 inline-block bg-[#08B9ED] text-white px-6 py-2 rounded font-medium hover:opacity-90 transition-opacity">
               Return Home
             </Link>
          </div>
        ) : data ? (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <h3 className="text-sm font-medium text-gray-500 mb-1">Total Applications</h3>
                 <p className="text-3xl font-bold text-gray-900">{data.total_applications}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
                 <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.revenue_pence)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <h3 className="text-sm font-medium text-gray-500 mb-1">Conversion Rate</h3>
                 <p className="text-3xl font-bold text-gray-900">{(data.conversion_rate * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications by Status</h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(data.by_status).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 flex-1 min-w-[120px] text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">{status}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Leads Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                 <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-white">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {data.recent_applications.map((app) => (
                       <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-medium text-gray-900">
                             {app.leads?.first_name || 'Unknown'} {app.leads?.last_name || ''}
                           </div>
                           <div className="text-xs text-gray-500 font-mono mt-1">{app.id.substring(0, 8)}...</div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {new Date(app.created_at).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                             ${app.status === 'paid' ? 'bg-green-100 text-green-800' : 
                               app.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                               app.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                               'bg-yellow-100 text-yellow-800'}`}>
                             {app.status}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                           {formatCurrency(app.total_pence || 0)}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {app.paid_at ? new Date(app.paid_at).toLocaleDateString() : '-'}
                         </td>
                       </tr>
                     ))}
                     {data.recent_applications.length === 0 && (
                       <tr>
                         <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                           No applications found
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}
