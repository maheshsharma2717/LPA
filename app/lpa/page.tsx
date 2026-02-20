"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NeedHelp from "../shared/needHelp";

export default function LPAStepOne() {
  const routePage = useRouter();
  const [currentStep, setCurrentStep] = useState("start");
  const [backHistory, setBackHistory] = useState<string[]>(["start"]);
  const [stepNumber, setStepNumber] = useState(1);

  type OptionType = {
    label: string;
    next: string;
  };

  type QuestionType = {
    question: string;
    description?: string;
    options?: OptionType[];
    type?: "normal" | "info" | "lastStep" | "notEligible" | "end";
    qimage?: "family" | "persondocument" | "globecaution" | "startassisted";
  };

  const renderQimage = (qimage?: string) => {
    switch (qimage) {
      case "family":
        return { src: "/family1.png", width: 170, height: 150 };
      case "persondocument":
        return { src: "/persondocument1.png", width: 64, height: 150 };
      case "globecaution":
        return { src: "/globecaution1.png", width: 120, height: 120 };
      case "startassisted":
        return { src: "/start-assisted.png", width: 240, height: 150 };
      default:
        return null;
    }
  };

  const formatQuestion = (question: string) => {
    const highlights = [
      "Lasting Power of Attorney",
      "over 18",
      "you and your partner",
      "England or Wales",
    ];

    let formatted = question;

    highlights.forEach((word) => {
      formatted = formatted.replace(
        new RegExp(word, "gi"),
        `<span class="text-[#08b9ed] font-semibold">${word}</span>`,
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const questionData: Record<string, QuestionType> = {
    start: {
      question: "Who are the Lasting Power of Attorney documents for?",
      description:
        "If you are creating these documents as an attorney or doing these documents for someone else, then please choose 'Someone else'.",
      options: [
        { label: "Me", next: "areYouOver18" },
        { label: "Me and my partner", next: "mentalCapacityBoth" },
        { label: "Someone else", next: "someoneElseCount" },
      ],
      qimage: "family",
    },

    areYouOver18: {
      question: "Are you over 18?",
      options: [
        { label: "Yes", next: "englandCheck" },
        { label: "No", next: "notEligible" },
      ],
      qimage: "persondocument",
    },

    mentalCapacityBoth: {
      question:
        "Are you and your partner both over 18 and have mental capacity to make decisions?",
      options: [
        { label: "Yes", next: "englandCheck" },
        { label: "No", next: "notEligible" },
      ],
      qimage: "persondocument",
    },

    mentalCapacitySingle: {
      question:
        "Is the person who these documents are for over 18 years old and has mental capacity to make decisions?",
      options: [
        { label: "Yes", next: "englandCheck" },
        { label: "No", next: "notEligible" },
      ],
      qimage: "persondocument",
    },

    mentalCapacityTwo: {
      question:
        "Are the persons who these documents are for over 18 years old and have mental capacity to make decisions?",
      options: [
        { label: "Yes", next: "englandCheck" },
        { label: "No", next: "notEligible" },
      ],
      qimage: "persondocument",
    },

    someoneElseCount: {
      question: "How many people is this for?",
      description:
        "You have said that you want documents for someone else, please tell us how many other people do you want these for?",
      options: [
        { label: "1 person", next: "mentalCapacitySingle" },
        { label: "2 person", next: "mentalCapacityTwo" },
        { label: "More than 2 people", next: "moreThanTwo" },
      ],
    },

    moreThanTwo: {
      question: "",
      description:
        "You have said that you want documents for more than 2 people, unfortunately we are\n\nunable to do this online, please call our team on 0800 888 6508 who will be happy to\n\nhelp you with this.",
      type: "info",
      qimage: "startassisted",
    },

    englandCheck: {
      question: "Do you live in England or Wales?",
      options: [
        { label: "Yes", next: "end" },
        { label: "No", next: "outsideEnglandWalesConfirm" },
      ],
      qimage: "globecaution",
    },

    outsideEnglandWalesConfirm: {
      question: "Confirm you wish to continue outside of England or Wales?",
      description:
        "Some countries will accept a notarised power of attorney.\n\nYou will need to register the power of attorney with the Office of the Public Guardian first.\n\nIf you wish to continue, it will be at your own risk.",
      options: [
        { label: "I understand and wish to proceed", next: "end" },
        { label: "I do not want to proceed", next: "notEligible" },
      ],
      qimage: "globecaution",
    },

    notEligible: {
      question: "",
      type: "notEligible",
      qimage: "globecaution",
    },

    end: {
      question: "Create a Power of Attorney online",
      description: "",
      type: "lastStep",
      qimage: "family",
    },
  };

  const currentQuestion = questionData[currentStep];
  const imageData = renderQimage(currentQuestion.qimage);

  const handleBack = () => {
    if (backHistory.length <= 1) return routePage.push("/");

    const newHistory = [...backHistory];
    newHistory.pop();
    const previousStep = newHistory[newHistory.length - 1];

    setBackHistory(newHistory);
    setCurrentStep(previousStep);
    setStepNumber((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#08b9ed] rounded-full"></div>
          <span className="text-lg font-bold text-zenco-dark tracking-tight">
            ZENCO<span className="text-[#08b9ed]">LEGAL</span>
          </span>
        </div>
        {/* <div className="text-sm font-medium text-gray-500">
          Step {stepNumber} of 5
        </div> */}
      </header>

      <main className="grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full p-8 sm:p-12">
          {imageData && (
            <div className="flex justify-center mb-10">
              <Image
                src={imageData.src}
                alt="question-image"
                width={imageData.width}
                height={imageData.height}
              />
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zenco-dark mb-4 leading-tight text-center">
            {formatQuestion(currentQuestion.question)}
          </h2>

          {currentQuestion.type === "notEligible" && (
            <>
              <div className="mt-6 space-y-6 text-[#6B7588] text-start leading-relaxed">
                <h2 className="text-2xl sm:text-2xl font-extrabold text-[#3A3A3C] mb-4 leading-tight text-Start">
                  Sorry, we can't continue
                </h2>
                <p>
                  You have said that the people this document is for are not
                  over 18 or do not have the mental capacity to make decisions .
                </p>

                <p>
                  The people this document is for must be 18 years or over and
                  be able to make decisions and understand what this document is
                  for.
                </p>

                <p>
                  Unfortunately this means that you can't use our online service
                  to get a Lasting Power of Attorney in place. If you answered
                  this question incorrectly then please click the'Back' button.
                </p>
              </div>
              <NeedHelp />
            </>
          )}
          {currentQuestion.type === "info" && (
            <>
              {currentQuestion.description && (
                <>
                  {/* <div className="mt-6  text-[#6B7588] text-start leading-relaxed whitespace-pre-line">
                    <p>{currentQuestion.description}</p>
                  </div> */}
                  <div className="">
                    <p className="text-2xl sm:text-3xl font-extrabold text-zenco-dark mb-4 leading-tight text-start">
                      Documents for{" "}
                      <span className="text-[#08b9ed]">more than 2 people</span>
                    </p>
                    <p>
                      You have said that you want documents for more than 2
                      people, unfortunately we are unable to do this online,
                      please call our team on{" "}
                      <span className="text-[#08b9ed]"> 0800 888 6508</span> who
                      will be happy to help you with this.
                    </p>
                  </div>
                </>
              )}
              <NeedHelp />
            </>
          )}

          {currentQuestion.type === "lastStep" && (
            <>
              <div className="border border-gray-300 rounded-md p-6 bg-white max-w-2xl">
                {/* Item 1 */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-green-600 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="currentColor"
                    >
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM17.4571 9.45711L11 15.9142L6.79289 11.7071L8.20711 10.2929L11 13.0858L16.0429 8.04289L17.4571 9.45711Z"></path>
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      Protect yourself and your family.
                    </h3>
                    <p className="text-gray-600 leading-relaxed mt-1">
                      Ensure everything is in place before it is needed.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-green-600 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="currentColor"
                    >
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM17.4571 9.45711L11 15.9142L6.79289 11.7071L8.20711 10.2929L11 13.0858L16.0429 8.04289L17.4571 9.45711Z"></path>
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      Secure your family's future.
                    </h3>
                    <p className="text-gray-600 leading-relaxed mt-1">
                      Guarantee access to finance when most needed and make
                      important health decisions.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="text-green-600 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="currentColor"
                    >
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM17.4571 9.45711L11 15.9142L6.79289 11.7071L8.20711 10.2929L11 13.0858L16.0429 8.04289L17.4571 9.45711Z"></path>
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      It only takes 15 minutes.
                    </h3>
                    <p className="text-gray-600 leading-relaxed mt-1">
                      Easy to use system. Designed for all ages. Save your
                      progress as you go.
                    </p>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => routePage.push("/register")}
                  className="w-full bg-[#08b9ed] hover:bg-cyan-700 text-white font-semibold py-3 rounded-md transition"
                >
                  Continue online
                </button>
              </div>
            </>
          )}

          {currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setBackHistory((prev) => [...prev, option.next]);
                    setCurrentStep(option.next);
                    setStepNumber((prev) => Math.min(prev + 1, 5));
                  }}
                  className="px-8 py-4 rounded border bg-white border-gray-300 hover:bg-[#334A5E] shadow-lg transition-all duration-200 group"
                >
                  <span className="font-bold text-lg text-[#334A5E] group-hover:text-white text-center">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#6B7588] text-lg font-bold mt-8 hover:text-black transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </main>
    </div>
  );
}
