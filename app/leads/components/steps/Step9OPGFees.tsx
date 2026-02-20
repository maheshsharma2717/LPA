"use client";

import { TextField } from "@mui/material";



import { useEffect } from "react";

type Props = {
  onNext: () => void;
  isSaving: boolean;
};

export default function OPGFeesTab({ onNext, isSaving }: Props) {
  useEffect(() => {
    if (isSaving) {
      onNext();
    }
  }, [isSaving]);

  return (
    <>
      <section>
        <div>
          <section>
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="text-center text-3xl font-bold">
                  Registration fee Remission
                </p>
                <div className="flex flex-col gap-3">
                  <p>
                    If You are not in receipt of benifits which qualify for
                    exemption of the fees, but the gross annual income is less
                    than £12,000 per year (before tax) or you receive Universal
                    Credit, you may be able to receive a fee remission of 50%
                    discount on the registration fees with the Office of the
                    Public Guardian.
                  </p>
                  <p>
                    If applicable, please select any of the requirements below
                    that You meet.
                  </p>
                  <p>
                    You must be able to supply evidence for at least one if
                    selected.
                  </p>

                  <p className="text-lg font-semibold">
                    Is your income less than £12,000 a year?
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <button className="border-2 border-gray-300 leading-loose p-3 cursor-pointer">
                        No, your income is £12k per year or more
                      </button>
                      <button className="border-2 border-[#334a5e] leading-loose p-3 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer">
                        Yes, your income is less than £12k per year
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-lg font-semibold">
                    Do you receive Universal Creadit?
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <button className="border-2 border-gray-300 leading-loose p-3 cursor-pointer">
                        No, you do not receive universal credit
                      </button>
                      <button className="border-2 border-[#334a5e] leading-loose p-3 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer">
                        Yes, you do receive universal credit
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-lg font-semibold">
                    Please choose anything below that applies to you.
                  </p>

                  <div className="flex flex-col gap-3">
                    <p className="">Select from choice below:</p>
                    <div className="flex flex-col gap-1">
                      <button className="border-2 border-[#334a5e] leading-loose py-3 px-7 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer flex justify-between items-center">
                        Paid employment
                        <input
                          type="checkbox"
                          // checked={formData.marketing}

                          className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                        />
                      </button>
                      <button className="border-2 border-[#334a5e] leading-loose py-3 px-7 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer flex justify-between items-center">
                        Self-employment
                        <input
                          type="checkbox"
                          // checked={formData.marketing}

                          className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                        />
                      </button>
                      <button className="border-2  border-gray-300 leading-loose py-3 px-7 cursor-pointer flex justify-between items-center">
                        Non-means-tested benifits and pensions
                        <input
                          type="checkbox"
                          // checked={formData.marketing}

                          className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                        />
                      </button>
                      <button className="border-2  border-gray-300 leading-loose py-3 px-7 cursor-pointer flex justify-between items-center">
                        Intrest from capital stocks , shares or bonds
                        <input
                          type="checkbox"
                          // checked={formData.marketing}

                          className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                        />
                      </button>
                      <button className="border-2  border-gray-300 leading-loose py-3 px-7 cursor-pointer flex justify-between items-center">
                        No income
                        <input
                          type="checkbox"
                          // checked={formData.marketing}

                          className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                        />
                      </button>
                      <button className="border-2  border-gray-300 leading-loose py-3 px-7 cursor-pointer flex justify-between items-center">
                        None of above
                        <input
                          type="checkbox"
                          // checked={formData.marketing}

                          className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div></div>
            </div>
          </section>
        </div>

        {/* Registration Fees */}
        <div>
          <section>
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="text-center text-3xl font-bold">
                  Registration fees
                </p>
                <p className="text-center text-xl font-bold">
                  Evidance for remission
                </p>
                <div className="flex flex-col gap-3">
                  <p>
                    When these documents are sent to the Office of the Public
                    Guardian, you will need to provide one of the following as
                    evidance to prove you the donor eligible for fee remission.
                  </p>
                  <p className="font-bold">
                    You don't need these to finish your documents today, this is
                    just for information as it is a good idea to get these ready
                    while we post the documents to you.
                  </p>
                  {/* Paid employment */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <div className="flex flex-col gap-3 border-2 border-gray-300 leading-loose cursor-pointer shadow-md rounded px-4 pt-5 pb-9">
                        <p className="text-gray-500 text-lg font-semibold">
                          Paid Employment
                        </p>
                        <p className="text-gray-500 leading-6">
                          A P60 or 3 months' consecutive wage slips from your
                          current employment,(from when returning documents
                          e.g., if returning documents in May you would need to
                          provide April, March & February).
                        </p>
                      </div>
                    </div>
                    {/* Self-employment */}
                    <div className="flex flex-col">
                      <div className="flex flex-col gap-3 border-2 border-gray-300 leading-loose cursor-pointer shadow-md rounded px-4 pt-5 pb-9">
                        <p className="text-gray-500 text-lg font-semibold">
                          Self-employment
                        </p>
                        <p className="text-gray-500 leading-6">
                          Your most recent self-assessment tax return and HMRC
                          tax calculation or audited accounts certified by a
                          qualified accountant.
                        </p>
                      </div>
                    </div>

                    {/* Non-means-tested benifits and pensions */}
                    <div className="flex flex-col">
                      <div className="flex flex-col gap-3 border-2 border-gray-300 leading-loose cursor-pointer shadow-md rounded px-4 pt-5 pb-9">
                        <p className="text-gray-500 text-lg font-semibold">
                          Non-means-tested benifits and pensions
                        </p>
                        <p className="text-gray-500 leading-6">
                          An official letter from the Pension Service for the
                          current financial year. Please contact the HMRC
                          helpline if you need copies on <u> 0800 731 0469.</u>
                        </p>
                      </div>
                    </div>

                    {/* Interest from capital stocks, share or bonds */}
                    <div className="flex flex-col">
                      <div className="flex flex-col gap-3 border-2 border-gray-300 leading-loose cursor-pointer shadow-md rounded px-4 pt-5 pb-9">
                        <p className="text-gray-500 text-lg font-semibold">
                          Interest from capital stocks, share or bonds
                        </p>
                        <p className="text-gray-500 leading-6">
                          Statements or vouchers showing gross income for the
                          current financial year.
                        </p>
                      </div>
                    </div>

                    {/* No income */}
                    <div className="flex flex-col">
                      <div className="flex flex-col gap-3 border-2 border-gray-300 leading-loose cursor-pointer shadow-md rounded px-4 pt-5 pb-9">
                        <p className="text-gray-500 text-lg font-semibold">
                          No income
                        </p>
                        <p className="text-gray-500 leading-6">
                          Your most recent self-assessment tax return and HMRC
                          tax calculation or auditied accounts certified by a
                          qualified accountant.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div></div>
            </div>
          </section>
        </div>
      </section>
      {/* Reg fee payment method selection  */}
      <section>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-9">
            <p className="text-center text-3xl font-bold">Registration fees</p>
            <div className="flex flex-col gap-5">
              <p>
                You have said that You do not qualify for remission (discount)
                or exemption of the fees. If this is not correct then{" "}
                <u className="cursor-pointer">click here</u> to go back and
                change your selection.
              </p>
              <p className="font-semibold">
                The amount due to the Office of the Public Guardian is{" "}
                <span className="text-cyan-500">£184</span>.
              </p>
              <p className="font-semibold">
                Please tell us how you would like to pay below.
              </p>
              <p className="">
                If you select <span className="text-cyan-500">Cheque</span> you
                must send a cheque addressed to 'office of the Public Guardian'
                with your application writing the name of the donor (You) on the
                back of the cheque.
              </p>
              <p className="">
                If you select <span className="text-cyan-500">Card</span> you
                must provide a Contact phone number below so that the'Office of
                the Public Guardian can make contact to take payment of their
                fees.
              </p>
              <div className="flex flex-col gap-3">
                <p className="text-xl font-semibold">
                  How do you want to pay the registration fees?
                </p>
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    <button className="border-2 border-gray-300 leading-loose p-3 cursor-pointer">
                      Card
                    </button>
                    <button className="border-2 border-[#334a5e] leading-loose p-3 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer">
                      Cheque
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold">
                  Please enter the phone number the Office of the Public
                  Guardian should contact you on for payment.
                </p>
                <TextField
                // value={formData.firstName}
                // onChange={(e) =>
                //   handleFormChange("firstName", e.target.value)
                // }
                // fullWidth
                />
              </div>
            </div>
          </div>
          <div></div>
        </div>
      </section>
    </>
  );
}
