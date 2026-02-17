import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b border-gray-100 py-4 px-6 sm:px-12 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Placeholder Logo */}
          <div className="w-8 h-8 bg-zenco-blue rounded-full"></div>
          <span className="text-xl font-bold text-zenco-dark tracking-tight">ZENCO<span className="text-zenco-blue">LEGAL</span></span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
          <Link href="#" className="hover:text-zenco-blue transition-colors">Products</Link>
          <Link href="#" className="hover:text-zenco-blue transition-colors">About Us</Link>
          <Link href="#" className="hover:text-zenco-blue transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-zenco-blue transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="tel:08081693475" className="text-sm font-semibold text-gray-700 hidden sm:block">0808 169 3475</Link>
          <button className="md:hidden text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="grow">
        <section className="bg-gray-50 py-16 px-6 sm:px-12 lg:py-24 flex flex-col items-center">
          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 overflow-hidden border border-blue-50">
              <div className="p-8 sm:p-12 lg:p-16 text-center sm:text-left flex flex-col sm:flex-row items-center gap-12">
                <div className="flex-1">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-zenco-dark leading-tight mb-6">
                    Create a Power of Attorney <span className="text-zenco-blue">online</span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    It’s easy to get a power of attorney (POA) document from the comfort of your own home. 
                    Affordable prices for everyone at only <span className="font-bold text-zenco-dark">£99</span> per document.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Link 
                      href="/start/lpa" 
                      className="bg-zenco-blue hover:bg-opacity-90 text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-200 text-center"
                    >
                      Let’s get started
                    </Link>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed italic border-l-4 border-zenco-blue pl-4">
                    Our mission is to make applying for power of attorney accessible to everyone. 
                    That’s why we’re thrilled to offer this unbeatable price of only £99 per power of attorney (POA) document.
                    No hidden fees, no complicated processes – just a seamless and budget-friendly solution for all!
                  </p>
                </div>
                
                <div className="flex-1 hidden lg:block relative h-64 w-full max-w-sm">
                  <div className="absolute inset-0 bg-blue-100 rounded-3xl rotate-3"></div>
                  <div className="absolute inset-0 bg-white border-2 border-zenco-blue/10 rounded-3xl -rotate-3 p-8 flex flex-col justify-center gap-4">
                    <div className="w-full h-8 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-3/4 h-8 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-1/2 h-8 bg-zenco-blue/20 rounded animate-pulse mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-6 sm:px-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-zenco-blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zenco-dark">15 Minutes</h3>
            <p className="text-gray-600">Complete your application quickly from your phone, tablet or computer.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-zenco-blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zenco-dark">Safe & Secure</h3>
            <p className="text-gray-600">Your data is encrypted and handled by legal experts for your peace of mind.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-zenco-blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zenco-dark">Only £99</h3>
            <p className="text-gray-600">The most affordable way to secure your future without high solicitor fees.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zenco-dark text-white py-12 px-6 sm:px-12 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-zenco-blue rounded-full"></div>
              <span className="text-xl font-bold tracking-tight">ZENCO<span className="text-zenco-blue">LEGAL</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Providing affordable and accessible legal documents for everyone. Secure your future today with Zenco Legal.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="text-gray-400 text-sm flex flex-col gap-2">
                <li><Link href="#" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="text-gray-400 text-sm flex flex-col gap-2">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-bold mb-4">Contact Us</h4>
            <ul className="text-gray-400 text-sm flex flex-col gap-2">
              <li>0808 169 3475</li>
              <li>info@zenco.com</li>
              <li>Mon - Fri: 9am - 5pm</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} Zenco Legal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
