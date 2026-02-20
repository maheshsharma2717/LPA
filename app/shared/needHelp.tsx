"use client";

import { useState } from "react";

export default function NeedHelp() {

  const [needHelp, setNeedHelp] = useState(false);

  return (
    <>
      <div
        onClick={() => setNeedHelp(!needHelp)}
        className="flex justify-between mt-8 border border-[#ced4da] bg-white p-3"
      >
        <h3 className="text-md text-[#08b9ed] font-bold">NEED HELP?</h3>
        {needHelp ? (
          <svg
            className="text-[#ced4da]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M11.9999 10.8284L7.0502 15.7782L5.63599 14.364L11.9999 8L18.3639 14.364L16.9497 15.7782L11.9999 10.8284Z"></path>
          </svg>
        ) : (
          <svg
            className="text-[#ced4da]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path>
          </svg>
        )}
      </div>
      {needHelp && (
            <>
            <div className="mt-8 p-2 text-[#6B7588]">
              <div className="space-y-7 text-sm  leading-relaxed">
                {/* Call Us */}
                <div className="flex gap-3">
                  <div>
                    <svg
                      className="text-[#08b9ed]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M21 16.42V19.9561C21 20.4811 20.5941 20.9167 20.0705 20.9537C19.6331 20.9846 19.2763 21 19 21C10.1634 21 3 13.8366 3 5C3 4.72371 3.01545 4.36687 3.04635 3.9295C3.08337 3.40588 3.51894 3 4.04386 3H7.5801C7.83678 3 8.05176 3.19442 8.07753 3.4498C8.10067 3.67907 8.12218 3.86314 8.14207 4.00202C8.34435 5.41472 8.75753 6.75936 9.3487 8.00303C9.44359 8.20265 9.38171 8.44159 9.20185 8.57006L7.04355 10.1118C8.35752 13.1811 10.8189 15.6425 13.8882 16.9565L15.4271 14.8019C15.5572 14.6199 15.799 14.5573 16.001 14.6532C17.2446 15.2439 18.5891 15.6566 20.0016 15.8584C20.1396 15.8782 20.3225 15.8995 20.5502 15.9225C20.8056 15.9483 21 16.1633 21 16.42Z"></path>
                    </svg>
                  </div>

                  <div className="flex flex-col">
                    <p className="font-bold text-[#08b9ed]">Call us</p>
                    <p>0800 888 6508</p>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="flex gap-3">
                  <div>
                    <svg
                      className="text-[#08b9ed]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M2 11H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V11ZM17 3H21C21.5523 3 22 3.44772 22 4V9H2V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3Z"></path>
                    </svg>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="font-bold text-[#08b9ed]">Opening hours</p>

                    <div className="flex gap-6">
                      <div className="flex flex-col">
                        <p>Monday</p>
                        <p>Tuesday</p>
                        <p>Wednesday</p>
                        <p>Thursday</p>
                        <p>Friday</p>
                        <p>Weekends</p>
                      </div>

                      <div className="flex flex-col">
                        <p>8:00am - 5:30pm</p>
                        <p>8:00am - 5:30pm</p>
                        <p>8:00am - 5:30pm</p>
                        <p>8:00am - 5:30pm</p>
                        <p>8:00am - 5:00pm</p>
                        <p>CLOSED</p>
                      </div>
                    </div>

                    <p className="text-xs">(Bank holiday hours might differ)</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-3">
                  <div>
                    <svg
                      className="text-[#08b9ed]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM12.0606 11.6829L5.64722 6.2377L4.35278 7.7623L12.0731 14.3171L19.6544 7.75616L18.3456 6.24384L12.0606 11.6829Z"></path>
                    </svg>
                  </div>

                  <div className="flex flex-col">
                    <p className="font-bold text-[#08b9ed]">Email us</p>
                    <p>enquiries@zenco.com</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-3">
                  <div>
                    <svg
                      className="text-[#08b9ed]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M18.364 17.364L12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364ZM12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13Z"></path>
                    </svg>
                  </div>

                  <div className="flex flex-col">
                    <p className="font-bold text-[#08b9ed]">Address</p>
                    <p>
                      Zenco Legal
                      <br />
                      Second Floor
                      <br />
                      64 Mansfield Street
                      <br />
                      Leicester LE1 3DL
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
    </>
  );
}
