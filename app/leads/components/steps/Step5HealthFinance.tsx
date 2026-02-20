"use client";

export default function HealthFinanceTab() {
  return (
    <>
      <section>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <p className="text-center text-3xl font-bold">
              Life-sustaining Treatment
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p>
              You must choose what you want to happen if you needed medical help
              to keep you alive and you no longer had mental capacity.
            </p>
            <p>
              If you chooese YES and you ever needed life-sustaining treatment but can't make decisions, the attorneys can speak to doctors on your behalf as if they were you.
            </p>
            <p>
              If you choose NO doctors will make decisions about life-sustaining treatment for you.
            </p>
            <p className="text-xl font-semibold">
              Do you want the attorneys to make decisins about life-sustaining treatment?
            </p>

            <div className="flex flex-col border border-gray-400 justify-center items-center gap-5 py-5">
              <p className="font-semibold">Yes - give the attorney authority</p>
              <p className="font-semibold">No - do not give the attorney authority</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
