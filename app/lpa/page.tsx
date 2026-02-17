"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LPAStepOne() {
  const routePage = useRouter();
  const [currentStep, setCurrentStep] = useState("start");
  const [backHistory, setBackHistory] = useState<string[]>(["start"]);

  const [stepNumber, setStepNumber] = useState(1);

  //   To check answers (this is not used for now later we will use it to get user preferrence):
  const [answers, setAnswers] = useState<Record<string, string>>({});

  type OptionType = {
    label: string;
    next: string;
    icon?: string; // we'll use icon key
  };

  type QuestionType = {
    question: string;
    description?: string;
    options?: OptionType[];
    type?: "normal" | "info" | "lastStep";
  };

  const CheckIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="currentColor"
      >
        <path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"></path>
      </svg>
    );
  };
  const renderIcon = (icon?: string) => {
    switch (icon) {
      case "user":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );

      case "partner":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M7 9C8.38071 9 9.5 7.88071 9.5 6.5C9.5 5.11929 8.38071 4 7 4C5.61929 4 4.5 5.11929 4.5 6.5C4.5 7.88071 5.61929 9 7 9ZM7 11C4.51472 11 2.5 8.98528 2.5 6.5C2.5 4.01472 4.51472 2 7 2C9.48528 2 11.5 4.01472 11.5 6.5C11.5 8.98528 9.48528 11 7 11ZM17.5 13C18.6046 13 19.5 12.1046 19.5 11C19.5 9.89543 18.6046 9 17.5 9C16.3954 9 15.5 9.89543 15.5 11C15.5 12.1046 16.3954 13 17.5 13ZM17.5 15C15.2909 15 13.5 13.2091 13.5 11C13.5 8.79086 15.2909 7 17.5 7C19.7091 7 21.5 8.79086 21.5 11C21.5 13.2091 19.7091 15 17.5 15ZM20 21V20.5C20 19.1193 18.8807 18 17.5 18C16.1193 18 15 19.1193 15 20.5V21H13V20.5C13 18.0147 15.0147 16 17.5 16C19.9853 16 22 18.0147 22 20.5V21H20ZM10 21V17C10 15.3431 8.65685 14 7 14C5.34315 14 4 15.3431 4 17V21H2V17C2 14.2386 4.23858 12 7 12C9.76142 12 12 14.2386 12 17V21H10Z"></path>
          </svg>
        );

      case "group":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );

      case "check":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"></path>
          </svg>
        );

      case "cross":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
          </svg>
        );

      default:
        return null;
    }
  };

  const questionData: Record<string, QuestionType> = {
    start: {
      question: "Who are the Lasting Power of Attorney documents for?",
      description:
        "If you are creating these documents as an attorney or doing these documents for someone else, then please choose 'Someone else'.",
      options: [
        { label: "Myself", next: "mentalCapacitySingle", icon: "user" },
        { label: "Your partner", next: "mentalCapacityTwo", icon: "partner" },
        { label: "Someone else", next: "someoneElseCount", icon: "group" },
      ],
    },

    someoneElseCount: {
      question: "How many people is this for?",
      description:
        "You have said that you want documents for someone else, please tell us how many other people do you want these for?",
      options: [
        { label: "1 person", next: "mentalCapacitySingle", icon: "user" },
        { label: "2 people", next: "mentalCapacityTwo", icon: "partner" },
        { label: "More than 2 people", next: "moreThanTwo", icon: "group" },
      ],
    },

    mentalCapacitySingle: {
      question:
        "Is the person who these documents are for over 18 years old and has mental capacity to make decisions?",
      options: [
        { label: "Yes", next: "englandCheck", icon: "check" },
        { label: "No", next: "notEligible", icon: "cross" },
      ],
    },

    mentalCapacityTwo: {
      question:
        "Are the persons who these documents are for over 18 years old and have mental capacity to make decisions?",
      options: [
        { label: "Yes", next: "englandCheck", icon: "check" },
        { label: "No", next: "notEligible", icon: "cross" },
      ],
    },

    moreThanTwo: {
      question: "Documents for more than 2 people",
      description:
        "Unfortunately we are unable to do this online. Please call our team on 0800 888 6508.",
      type: "info",
    },

    // over18: {
    //   question: "Are you over 18?",
    //   options: [
    //     { label: "Yes", next: "englandCheck", icon: "check" },
    //     { label: "No", next: "notEligible", icon: "cross" },
    //   ],
    // },

    englandCheck: {
      question: "Do you live in England or Wales?",
      options: [
        { label: "Yes", next: "end", icon: "check" },
        { label: "No", next: "notEligible", icon: "cross" },
      ],
    },

    notEligible: {
      question: "Sorry, we can't continue",
      description:
        "Unfortunately this means that you can't use our online service to get a Lasting Power of Attorney in place.",
      type: "info",
    },

    end: {
      question: "Create a Power of Attorney",
      type: "lastStep",
    },
  };

  const currentQuestion = questionData[currentStep];

  const handleBack = () => {
    if (backHistory.length <= 1) return routePage.push("/");

    const newHistory = [...backHistory];
    newHistory.pop(); // remove current step
    const previousStep = newHistory[newHistory.length - 1];

    setBackHistory(newHistory);
    setCurrentStep(previousStep);
    setStepNumber((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Journey Header */}
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zenco-blue rounded-full"></div>
          <span className="text-lg font-bold text-zenco-dark tracking-tight">
            ZENCO<span className="text-zenco-blue">LEGAL</span>
          </span>
        </div>
        <div className="text-sm font-medium text-gray-500">
          Step Step {stepNumber} of 5
        </div>
      </header>

      {/* Main Content */}
      <main className="grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 sm:p-12 border border-blue-50">
          <button
            onClick={handleBack}
            className="text-zenco-blue hover:text-opacity-80 flex items-center gap-2 text-sm font-bold mb-8 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            GO BACK
          </button>

          {/* Final Data response  */}
          {/* <pre className="mt-8 text-xs bg-gray-100 p-4 rounded">
            {JSON.stringify(answers, null, 2)}
          </pre> */}

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zenco-dark mb-4 leading-tight">
            {/* Who are the Lasting Power of Attorney documents for? */}
            {currentQuestion.question}
          </h2>
          {currentQuestion.description && (
            <p className="text-gray-600 mb-10 leading-relaxed">
              {currentQuestion.description}
            </p>
          )}
          {currentQuestion.type === "lastStep" && (
            <>
              <div className="my-9 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-zenco-blue mb-4 group-hover:scale-110 transition-transform duration-200">
                      {CheckIcon()}
                    </div>
                    <p>
                      <strong> Protect yourself and your family.</strong>
                      <br />
                      Ensure everything is in place before it is needed.
                      <br />
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-zenco-blue mb-4 group-hover:scale-110 transition-transform duration-200">
                      {CheckIcon()}
                    </div>
                    <p>
                      <strong> Secure your family's future.</strong>
                      <br />
                      Guarantee access to finance when most needed and make
                      important health decisions. <br />
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-zenco-blue mb-4 group-hover:scale-110 transition-transform duration-200">
                      {CheckIcon()}
                    </div>
                    <p>
                      <strong> It only takes 15 minutes.</strong>
                      <br />
                      Easy to use system. Designed for all ages. Save your
                      progress as you go. <br />
                    </p>
                  </div>
                </div>
              </div>
              <button
              onClick={() => {routePage.push("/register")}}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-gray-100 hover:border-zenco-blue hover:bg-blue-50/50 transition-all duration-200 group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-zenco-blue mb-4 group-hover:scale-110 transition-transform duration-200">
                  {CheckIcon()}
                </div>

                <span className="font-bold text-lg text-zenco-dark text-center">
                  Continue Online
                </span>
              </button>
            </>
          )}
          {currentQuestion.type === "info" && (
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-zenco-dark mb-4">
                Need Help?
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Call us:</strong> 0800 888 6508
                </p>

                <p>
                  <strong>Email:</strong> enquiries@zenco.com
                </p>

                <p>
                  <strong>Address:</strong>
                  <br />
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
          )}

          {currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Store answer
                    setAnswers((prev) => {
                      const updated = { ...prev };
                      delete updated[currentStep];
                      return updated;
                    });

                    // Update history
                    setBackHistory((prev) => [...prev, option.next]);

                    // Move forward
                    setCurrentStep(option.next);
                    setStepNumber((prev) => Math.min(prev + 1, 5));
                  }}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-gray-100 hover:border-zenco-blue hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-zenco-blue mb-4 group-hover:scale-110 transition-transform duration-200">
                    {renderIcon(option.icon)}
                  </div>

                  <span className="font-bold text-lg text-zenco-dark text-center">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Trust Badge / Security Info */}
      <footer className="py-8 px-6 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-50 grayscale">
          {/* Mock Trust Badges */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span>Expert Review</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span>SSL Secure</span>
          </div>
        </div>
        <p>Your details are protected by 256-bit encryption</p>
      </footer>
    </div>
  );
}
