"use client";

import { FormControl, MenuItem, Select } from "@mui/material";
import Link from "next/link";

export default function Checkout() {
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
          {/*  Checkout Section */}
          <section className="container mx-auto">
            <div className="flex flex-col justify-center items-center my-5">
              <div className="flex flex-col gap-5">
                <p className="text-center text-2xl font-medium">Checkout</p>

                {/* Order details */}
                <div className="flex flex-col border border-gray-400">
                  <div className="flex flex-col px-4 pt-5 pb-9">
                    <p className="text-xl font-medium mb-4">Your Order</p>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between">
                        <p>Order</p>
                        <p>Subtotal</p>
                      </div>
                      <div className="flex justify-between">
                        <p>
                          Marie Clarie Lenicker Muscat - Lasting Power of <br />{" "}
                          Attorney Health and Welfare
                        </p>
                        <p>£99</p>
                      </div>
                      <div className="flex justify-between">
                        <p>
                          Marie Clarie Lenicker Muscat - Lasting Power of <br />{" "}
                          Attorney Property and Finance
                        </p>
                        <p>£99</p>
                      </div>
                      <hr />
                      <p>Includes expert checking and postage.</p>
                      <hr />
                      <div className="flex justify-between">
                        <p>Subtotal</p>
                        <p>£198</p>
                      </div>
                      <hr />
                      <div className="flex border-3 gap-3 border-cyan-400 rounded shadow-lg p-3">
                        <div className="flex flex-col">
                          <div>
                            <div className="flex justify-between">
                              <p>Upgrade to premium</p>
                            </div>
                            <p>£25 per document</p>
                          </div>
                          <div className="px-9 pt-4">
                            <ul className="list-disc">
                              <li>Freepost the signed documents back to us</li>
                              <li>
                                we check the signed LPAs and submit to the
                                Government
                              </li>
                              <li>
                                Guranteed first-time registration - or your
                                money back
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex flex-col">toggle button here</div>
                      </div>
                      <hr />
                      <div className="flex justify-between">
                        <p>Add-ons</p>
                        <p>£0</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Total</p>
                        <p>£198</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment details */}
                <div className="flex flex-col border border-gray-400 rounded">
                  <div className="flex flex-col px-4 py-5 gap-7">
                    <p>Payment</p>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <p>Card Details</p>
                        <div className="flex justify-between gap-2">
                          <button className="flex flex-col text-start w-full p-2 border border-gray-400 rounded shadow-md">
                            <span>cardicn</span>
                            Card
                          </button>
                          <button className="flex flex-col text-start w-full p-2 border border-gray-400 rounded shadow-md">
                            <span>cardicn</span>
                            Card
                          </button>
                          <button className="flex flex-col text-start w-full p-2 border border-gray-400 rounded shadow-md">
                            <span>cardicn</span>
                            Card
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p>Card number</p>
                        <input
                          type="text"
                          required
                          // value={formData.email}
                          // onChange={(e) =>
                          //     setFormData({ ...formData, email: e.target.value })
                          // }
                          className="w-full rounded border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                          placeholder="1234 1234 1234 1234 icons"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between gap-3">
                          <div className="w-full">
                            <p>Expiry date</p>
                            <div className="flex gap-2">
                              {" "}
                              <input
                                type="text"
                                required
                                // value={formData.email}
                                // onChange={(e) =>
                                //     setFormData({ ...formData, email: e.target.value })
                                // }
                                className="w-full rounded border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                                placeholder="MM / YY"
                              />
                            </div>
                          </div>
                          <div className="w-full">
                            <p>Security Code</p>
                            <div className="flex gap-2">
                              {" "}
                              <input
                                type="text"
                                required
                                // value={formData.email}
                                // onChange={(e) =>
                                //     setFormData({ ...formData, email: e.target.value })
                                // }
                                className="w-full rounded border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-zenco-blue focus:outline-none"
                                placeholder="CVC card icon"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p>Card number</p>
                        <FormControl fullWidth>
                          <p>Title</p>
                          <Select
                            value={"Italy"}
                            //   onChange={(e) =>
                            //     setNewPerson({ ...newPerson, title: e.target.value })
                            //   }
                          >
                            {["Italy", "France"].map((title) => (
                              <MenuItem key={title} value={title}>
                                {title}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>

                      <p>
                        By providing yor card information, you allow Zenco Legal
                        Limited to charge your card <br />
                        for future payments in accordance with their terms.
                      </p>
                    </div>
                    <button className="bg-cyan-400 py-5 rounded text-white font-medium">Confirm and pay £198.00</button>
                  </div>
                </div>

                {/* Need help */}
                <div className="flex flex-col w-full gap-5">
                <div className="flex flex-col gap-5 border border-gray-400 rounded p-3">
                  <div className="flex justify-between">
                    <p className="text-lg font-semibold">We're here to help</p>
                    <p>users icons</p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Need help with your payment?
                  </p>
                  <div className="flex gap-3">
                    <p>phoneicon</p>
                    <p>
                      Call us on <u>0800 888 6508</u>
                    </p>
                  </div>
                </div>
                <FormControl fullWidth>
                  <Select
                    value={"NEED HELP?"}
                    sx={{
                      fontWeight: 600,
                      color: "#06b6d4", // cyan-500
                    }}
                  >
                    <MenuItem
                      value="NEED HELP?"
                      sx={{
                        fontWeight: 600,
                        color: "#06b6d4",
                      }}
                    >
                      NEED HELP?
                    </MenuItem>
                  </Select>
                </FormControl>
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
      </div>
    </>
  );
}
