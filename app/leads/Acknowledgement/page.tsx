"use client";

import Link from "next/link";

export default function Acknowledgement() {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full border-b border-gray-100 py-4 px-6 sm:px-12 flex justify-between items-center bg-white sticky top-0 z-50">
          <div className="flex items-center gap-2">
            {/* Placeholder Logo */}
            <div className="w-8 h-8 bg-zenco-blue rounded-full"></div>
            <span className="text-xl font-bold text-zenco-dark tracking-tight">
              ZENCO<span className="text-zenco-blue">LEGAL</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <Link href="#" className="hover:text-zenco-blue transition-colors">
              Products
            </Link>
            <Link href="#" className="hover:text-zenco-blue transition-colors">
              About Us
            </Link>
            <Link href="#" className="hover:text-zenco-blue transition-colors">
              Pricing
            </Link>
            <Link href="#" className="hover:text-zenco-blue transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="tel:08081693475"
              className="text-sm font-semibold text-gray-700 hidden sm:block"
            >
              0808 169 3475
            </Link>
            <button className="md:hidden text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="grow">
          {/* Benefits Section */}
          <section className="container mx-auto">
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-col p-12 gap-20 justify-center">
                <div>
                  <p className=" leading-7 text-xl font-semibold">
                    You have now finished the Lasting Power of Attorney
                  </p>
                  <p className=" leading-7 text-xl font-semibold">
                    for <span className="text-cyan-400">Yourself</span>, next we will move on and get the
                  </p>
                  <p className=" leading-7 text-xl font-semibold">
                    documents for <span  className="text-cyan-400">Gabriel Lenicker</span> done.
                  </p>
                </div>
                <div className="w-full flex justify-between">
                  <button> back</button>
                  <button
                    // onClick={() => {routePage.push("/leads/Acknowledgement")}}
                    className="bg-cyan-400 cursor-pointer py-2 px-7 text-white rounded"
                  >
                    Continue
                  </button>{" "}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-zenco-dark text-white py-12 px-6 sm:px-12 mt-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-zenco-blue rounded-full"></div>
                <span className="text-xl font-bold tracking-tight">
                  ZENCO<span className="text-zenco-blue">LEGAL</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Providing affordable and accessible legal documents for
                everyone. Secure your future today with Zenco Legal.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="text-gray-400 text-sm flex flex-col gap-2">
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="text-gray-400 text-sm flex flex-col gap-2">
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Cookie Policy
                    </Link>
                  </li>
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
      </div>{" "}
    </>
  );
}
