"use client";

import { useEffect } from "react";

type Props = {
  onNext: () => void;
  isSaving: boolean;
};

export default function CertificateProviderTab({ onNext, isSaving }: Props) {
  useEffect(() => {
    if (isSaving) {
      onNext();
    }
  }, [isSaving]);
  return (
    <>
      <section>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-9">
            <p className="text-center text-3xl font-bold">
              The Certificate Provider
            </p>
            <div className="flex flex-col gap-5">
              <p>
                This person signs to confirm they have discussed the Lasting
                Power of Attorney with the Donor and that they are fully aware
                of what they are doing.
              </p>
              <div className="flex flex-col gap-3">
                <p className="text-xl font-semibold">
                  Do you want to choose your certificate provider now?
                </p>
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    <button className="border-2 border-gray-300 leading-loose p-3 cursor-pointer">
                      No, I will add them when I sign the documents
                    </button>
                    <button className="border-2 border-[#334a5e] leading-loose p-3 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer">
                      Yes, I know the details now
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 bg-cyan-200 rounded p-5 border border-cyan-400">
                <div className="flex text-xl text-cyan-900 font-semibold items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                  >
                    <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 9.5C12.8284 9.5 13.5 8.82843 13.5 8C13.5 7.17157 12.8284 6.5 12 6.5C11.1716 6.5 10.5 7.17157 10.5 8C10.5 8.82843 11.1716 9.5 12 9.5ZM14 15H13V10.5H10V12.5H11V15H10V17H14V15Z"></path>
                  </svg>
                  <p>Please read the below carefully</p>
                </div>
                <div className="flex flex-col gap-7 text-cyan-800">
                  <p className="text-lg font-semibold">Recommended</p>

                  <div className="flex flex-col gap-5">
                    <p>
                      We suggest using a friend or neighbour of the donor to be
                      a certificate provider.
                    </p>
                    <p>
                      This person signs to confirm they have discussed the
                      Lasting Power of Attorney with the Donor.
                    </p>
                    <p>
                      This person must be over 18 and have known the donor for a
                      minimum of 2 years.
                    </p>
                    <p>
                      This is very important: there are rules on who can't be a
                      certificate provider, too.
                    </p>
                    <p>
                      The certificate provider <u>must not</u> be:
                    </p>
                  </div>

                  <div className="ps-9">
                    <ul
                      className="list-disc"
                    //  style="list-style-type:disc;"
                    >
                      <li>An attorney or replacement attorney</li>
                      <li>
                        A relative, or someone who's related to an attorney -
                        this includes civil partners, spouces, in-laws and
                        step-relatives
                      </li>
                      <li>
                        The Donor's, or attorney's business partner or employee
                      </li>
                      <li>
                        Someone who owns, manages, is a director of or works at
                        a care home where they live or anyone related to them
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <p className="text-lg font-semibold">Alternative</p>
                  <p>You can also use a medical professional(doctor, social worker, nurse) to sign the document. They will sign in their professional capacity to ensure the donor has mental capacity.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold">Please add the certificate provider details below.</p>
                <button
                  className="border-2 border-gray-300 p-3 flex items-center justify-center gap-2 font-semibold cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                  >
                    <path d="M14 14.252V22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM18 17V14H20V17H23V19H20V22H18V19H15V17H18Z" />
                  </svg>

                  <span>Add a Certificate Provider</span>
                </button>
              </div>
            </div>
          </div>
          <div></div>
        </div>
      </section>
    </>
  );
}
