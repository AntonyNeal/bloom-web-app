import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBooking } from '../hooks/useBooking';
import { tracker } from '../utils/UnifiedTracker';

const Pricing = () => {
  const [sessionType, setSessionType] = useState('individual');
  const [fundingType, setFundingType] = useState('private');
  const [calculatorStep, setCalculatorStep] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const { openBookingModal } = useBooking('pricing_page');

  useEffect(() => {
    // Initialize pricing page tracking with unified tracker
    tracker.trackPricingPage();

    // All scroll depth and time tracking now handled by UnifiedTracker
  }, []);

  const scrollToCalculator = () => {
    const calculatorElement = document.getElementById('cost-calculator');
    if (calculatorElement) {
      calculatorElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookingClick = (location: string = 'pricing_calculator') => {
    // Track booking click with unified tracker
    tracker.trackBookingClick(location, sessionType);

    // Open booking modal
    openBookingModal();
  };

  const sessionOptions = [
    {
      value: 'individual',
      label: 'Individual Session',
      price: 'A$250.00',
      description: 'One-on-one therapy session',
    },
    {
      value: 'couples',
      label: 'Couples Session',
      price: 'A$300.00',
      description: 'Relationship counselling',
    },
    {
      value: 'ndis',
      label: 'NDIS Session',
      price: 'A$232.99',
      description: 'Self/plan-managed participants only',
    },
    {
      value: 'supervision',
      label: 'Professional Supervision',
      price: 'A$250.00',
      description: 'For psychology professionals only - not therapy',
    },
  ];

  const allFundingOptions = [
    {
      value: 'medicare',
      label: 'Medicare (with GP referral)',
      description: 'Just get a GP referral - up to $98.95 rebate',
      badge: 'Medicare rebate',
    },
    {
      value: 'private',
      label: 'Private Health Insurance',
      description: 'Private insurance with psychology coverage',
    },
    {
      value: 'no-coverage',
      label: 'No Coverage Available',
      description: 'None of the above apply to my situation',
    },
    {
      value: 'ndis',
      label: 'NDIS Participant (Self/Plan-Managed)',
      description: 'Self-managed or plan-managed NDIS participants only',
      badge: 'NDIS funded',
    },
  ];

  // Filter funding options based on session type
  const fundingOptions = allFundingOptions.filter((option) => {
    // Medicare doesn't cover couples therapy or supervision sessions
    if (
      option.value === 'medicare' &&
      (sessionType === 'couples' || sessionType === 'supervision')
    ) {
      return false;
    }
    // NDIS funding doesn't apply to supervision sessions
    if (option.value === 'ndis' && sessionType === 'supervision') {
      return false;
    }
    return true;
  });

  // Helper function to get correct rebate label
  const getRebateLabel = (fundingType: string): string => {
    switch (fundingType) {
      case 'medicare':
        return 'Medicare Rebate:';
      case 'private':
        return 'Health Fund Rebate:';
      case 'ndis':
        return 'NDIS Funding:';
      default:
        return 'Rebate:';
    }
  };

  const formatRebateAmount = (
    fundingType: string,
    rebateAmount: number
  ): string => {
    if (fundingType === 'private') {
      const minRebate = Math.max(0, rebateAmount - 30);
      const maxRebate = rebateAmount + 20;
      return `A$${minRebate.toFixed(2)} - A$${maxRebate.toFixed(2)}`;
    }
    return `A$${rebateAmount.toFixed(2)}`;
  };

  const formatOutOfPocketAmount = (
    fundingType: string,
    outOfPocket: number,
    rebateAmount: number
  ): string => {
    if (fundingType === 'private') {
      const sessionFee = parseFloat(getSessionPrice(sessionType));
      const minRebate = Math.max(0, rebateAmount - 30);
      const maxRebate = rebateAmount + 20;
      const maxOutOfPocket = sessionFee - minRebate;
      const minOutOfPocket = Math.max(0, sessionFee - maxRebate);
      return `A$${minOutOfPocket.toFixed(2)} - A$${maxOutOfPocket.toFixed(2)}`;
    }
    return `A$${outOfPocket.toFixed(2)}`;
  };

  const calculateOutOfPocket = () => {
    const sessionPrices = {
      individual: 250,
      couples: 300,
      ndis: 232.99,
      supervision: 250,
    };

    const basePrice = sessionPrices[sessionType as keyof typeof sessionPrices];

    if (fundingType === 'ndis') {
      return {
        outOfPocket: 0,
        rebate: basePrice,
        description: 'Fully covered by NDIS funding',
      };
    }

    if (fundingType === 'medicare') {
      // Medicare only covers individual sessions, not couples therapy
      if (sessionType === 'couples') {
        return {
          outOfPocket: basePrice,
          rebate: 0,
          description:
            'Medicare does not cover couples therapy - individual sessions only',
        };
      }

      const medicareRebate = 98.95; // Registered Psychologist rebate (Item 80010)
      const outOfPocket = basePrice - medicareRebate;
      return {
        outOfPocket,
        rebate: medicareRebate,
        description: 'With Medicare rebate (GP referral required)',
      };
    }

    if (fundingType === 'private') {
      // More realistic estimate: 50-80% of fee, capped at $80-120 per session
      const typicalRebate = Math.min(basePrice * 0.6, 100); // 60% or $100 cap, whichever is lower
      const outOfPocket = basePrice - typicalRebate;
      return {
        outOfPocket,
        rebate: typicalRebate,
        description:
          'ESTIMATE ONLY - Contact your insurer to confirm your actual rebate',
      };
    }

    if (fundingType === 'no-coverage') {
      return {
        outOfPocket: basePrice,
        rebate: 0,
        description: 'Full private payment',
      };
    }

    return {
      outOfPocket: basePrice,
      rebate: 0,
      description: 'Full private payment',
    };
  };

  const getSessionPrice = (type: string) => {
    const prices = {
      individual: '250.00',
      couples: '300.00',
      ndis: '232.99',
      supervision: '250.00',
    };
    return prices[type as keyof typeof prices] || '250.00';
  };

  const getRebateExplanation = (
    fundingType: string,
    rebateAmount: number
  ): string => {
    switch (fundingType) {
      case 'medicare':
        return `Medicare rebate of A$${rebateAmount.toFixed(2)} applies with GP referral`;
      case 'private': {
        const minRebate = Math.max(0, rebateAmount - 30);
        const maxRebate = rebateAmount + 20;
        return `⚠️ Private health rebate typically ranges A$${minRebate.toFixed(2)} - A$${maxRebate.toFixed(2)} depending on your policy level, provider, and annual limits. Contact your insurer directly before booking to confirm your exact coverage and claiming process.`;
      }
      case 'ndis':
        return `NDIS funding of A$${rebateAmount.toFixed(2)} covers the full session cost`;
      default:
        return `Rebate of A$${rebateAmount.toFixed(2)} applies`;
    }
  };

  const result = calculateOutOfPocket();

  const faqs = [
    {
      question: 'How much will I actually pay with Medicare?',
      answer:
        "With a valid GP Mental Health Care Plan, you'll receive a Medicare rebate of $98.95 per session (Registered Psychologist rate - Item 80010) for individual therapy sessions. This means you'll pay $151.05 out-of-pocket for a $250 session. Note: Medicare only covers individual psychology sessions, not couples therapy.",
    },
    {
      question: 'Can I claim on private health insurance?',
      answer:
        'IMPORTANT: You must contact your insurer directly to confirm your exact rebate amount before booking. Private health rebates vary significantly by provider (Medibank, BUPA, HCF, NIB, etc.), cover level, annual limits ($300-$1,000), and per-session caps ($80-120). Many policies have waiting periods (2-12 months). Our estimates are for guidance only - your insurer will provide the definitive answer for your specific policy.',
    },
    {
      question: 'What funding options are available?',
      answer:
        'Medicare rebates can reduce costs significantly for individual sessions (A$151.05 out-of-pocket with GP referral), self/plan-managed NDIS participants may have full funding available, and some private health insurance policies provide rebates. All fees are payable at the time of service.',
    },
    {
      question: 'How do NDIS payments work?',
      answer:
        'As an NDIS provider, we offer psychology sessions at $232.99 per session (NDIS price guide rate) for participants with self-managed or plan-managed funding. This allows you to use your NDIS psychology budget directly. NDIA-managed participants will need to check with their plan manager about accessing our services. Contact us to confirm your NDIS management type before booking.',
    },
    {
      question: 'What are Professional Supervision sessions?',
      answer:
        'Professional Supervision sessions are exclusively for psychology students, provisional psychologists, or registered psychologists who require clinical supervision for AHPRA registration requirements or ongoing professional development. These are NOT therapy sessions for personal mental health issues and are NOT suitable for general public clients seeking therapy. If you need therapy or counselling support, please book an Individual Psychology Session instead.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept standard payment methods through our secure online booking portal. Fees are collected at the time of service as per standard practice.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Psychology Session Fees & Funding Options | Medicare, NDIS, Private
          Health
        </title>
        <link rel="canonical" href="https://life-psychology.com.au/pricing" />
        <meta
          name="description"
          content="Psychology session fees and funding options. Medicare rebates up to $98.95, NDIS $233, private health insurance. Transparent pricing for therapy sessions."
        />
        <meta
          name="keywords"
          content="psychology fees, Medicare rebate psychology, NDIS psychology cost, private health psychology, therapy session costs, funding options"
        />
        <meta
          property="og:url"
          content="https://lifepsychology.com.au/pricing"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Psychology Session Fees & Funding Options"
        />
        <meta
          property="og:description"
          content="Psychology sessions $250. Medicare rebate $98.95 (Item 80010). Gap payment $151.05. NDIS $232.99 fully funded."
        />
        <meta
          property="og:image"
          content="https://lifepsychology.com.au/og-image.svg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://lifepsychology.com.au/og-image.svg"
        />
        <meta
          name="twitter:title"
          content="Psychology Session Fees & Funding Options"
        />
        <meta
          name="twitter:description"
          content="Psychology $250. Medicare rebate $98.95. Gap payment $151.05. NDIS fully funded."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 lg:py-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-full blur-2xl"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Affordable Mental Health Support
              <br />
              <span className="text-blue-100">When You Need It Most</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-6 text-blue-100">
              From <span className="text-white font-bold">$151.05</span>{' '}
              out-of-pocket with Medicare rebates
            </p>
            <p className="text-lg mb-8 text-blue-50">
              No waiting lists • Start today • Secure online sessions
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={scrollToCalculator}
                className="px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
              >
                Calculate Your Real Cost →
              </button>
              <button
                onClick={() => handleBookingClick()}
                className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </section>

        {/* Trust Signal Strip */}
        <section className="bg-white border-b border-gray-100 py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-sm font-medium text-gray-700">
                  Medicare Approved
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-blue-600 text-xl">👥</span>
                <span className="text-sm font-medium text-gray-700">
                  Registered Psychologist
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-purple-600 text-xl">📅</span>
                <span className="text-sm font-medium text-gray-700">
                  Available 6 Days/Week
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-indigo-600 text-xl">🔒</span>
                <span className="text-sm font-medium text-gray-700">
                  Secure Online Platform
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Cost Calculator (Above Fold) */}
        <section
          id="cost-calculator"
          className="py-12 lg:py-16 bg-gradient-to-br from-blue-50 to-indigo-50"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Find Out What You'll Actually Pay
              </h2>
              <p className="text-xl text-gray-600">
                Get your personalized cost in under 30 seconds
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
              {/* Progress Indicator */}
              <div className="flex justify-center mb-8">
                <div className="flex space-x-4">
                  {[1, 2, 3].map((stepNum) => (
                    <div
                      key={stepNum}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        stepNum < calculatorStep
                          ? 'bg-blue-600 text-white'
                          : stepNum === calculatorStep
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {stepNum}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 0/1: Session Type */}
              {calculatorStep === 0 && (
                <div className="text-center space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Let's find your personalized cost
                  </h3>
                  <p className="text-gray-600">
                    Answer a few quick questions to see exactly what you'll pay
                  </p>
                  <button
                    onClick={() => setCalculatorStep(1)}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    Get Started
                  </button>
                </div>
              )}

              {/* Step 1: Session Type */}
              {calculatorStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-center text-gray-900">
                    What type of session do you need?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sessionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSessionType(option.value);
                          if (option.value === 'ndis') {
                            setFundingType('ndis');
                            setCalculatorStep(3);
                          } else if (
                            (option.value === 'couples' ||
                              option.value === 'supervision') &&
                            fundingType === 'medicare'
                          ) {
                            // Medicare doesn't cover couples therapy or supervision, switch to private
                            setFundingType('private');
                            setCalculatorStep(2);
                          } else {
                            setCalculatorStep(2);
                          }
                        }}
                        className={`p-6 border-2 rounded-lg transition-all duration-200 text-left ${
                          option.value === 'supervision'
                            ? 'border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100'
                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">
                          {option.label}
                        </div>
                        <div
                          className={`text-2xl font-bold mt-2 ${
                            option.value === 'supervision'
                              ? 'text-orange-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {option.price}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {option.description}
                        </div>
                        {option.value === 'supervision' && (
                          <div className="mt-3 inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                            Psychology professionals only
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Funding Type */}
              {calculatorStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-center text-gray-900">
                    How would you like to fund your session?
                  </h3>

                  {sessionType === 'couples' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-orange-800 text-sm">
                        ℹ️ <strong>Note:</strong> Medicare rebates only apply to
                        individual psychology sessions. Couples therapy is not
                        covered by Medicare, but may be covered by some private
                        health funds.
                      </p>
                    </div>
                  )}

                  {sessionType === 'supervision' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">
                        ⚠️ <strong>Professional Supervision Only:</strong> This
                        service is exclusively for psychology students,
                        provisional psychologists, or registered psychologists
                        seeking professional supervision. It is NOT for general
                        therapy clients or personal mental health support. If
                        you're looking for therapy services, please select
                        "Individual Session" instead.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {fundingOptions
                      .filter((option) => option.value !== 'ndis')
                      .map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="funding"
                            value={option.value}
                            onChange={(e) => {
                              setFundingType(e.target.value);
                              setCalculatorStep(3);
                            }}
                            className="mr-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {option.description}
                            </div>
                            {option.badge && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded mt-2">
                                {option.badge}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Step 3: Results */}
              {calculatorStep === 3 && (
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Your Personalized Cost
                    </h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-600">Session Fee:</span>
                        <span className="font-semibold">
                          A${getSessionPrice(sessionType)}
                        </span>
                      </div>

                      {result.rebate > 0 && (
                        <div className="flex justify-between items-center text-lg text-green-600">
                          <span>{getRebateLabel(fundingType)}</span>
                          <span className="font-bold">
                            {formatRebateAmount(fundingType, result.rebate)}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-semibold text-gray-900">
                            You are out-of-pocket:
                          </span>
                          <span className="text-3xl font-bold text-blue-600">
                            {formatOutOfPocketAmount(
                              fundingType,
                              result.outOfPocket,
                              result.rebate
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {result.rebate > 0 && (
                      <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-semibold">
                          {getRebateExplanation(fundingType, result.rebate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {fundingType === 'no-coverage' && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">
                        💡 Available Funding Options:
                      </h4>
                      <ul className="text-orange-700 text-sm space-y-1">
                        {sessionType !== 'couples' && (
                          <li>
                            • Check if you're eligible for Medicare rebate with
                            a GP referral
                          </li>
                        )}
                        <li>
                          • Consider private health insurance with psychology
                          extras coverage
                        </li>
                        <li>
                          • Some employers offer Employee Assistance Programs
                          (EAP) with external providers
                        </li>
                        {sessionType === 'couples' && (
                          <li>
                            • Alternative approach: Book individual sessions for
                            each partner separately. Individual psychology
                            sessions are Medicare eligible (A$151.05 per session
                            with GP referral), allowing both partners to work on
                            personal issues that benefit the relationship. You
                            can add couples sessions as needed to complement the
                            individual work
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        // Track calculator completion with unified tracker
                        tracker.trackCalculatorCompletion({
                          session_type: sessionType,
                          funding_type: fundingType,
                          out_of_pocket: result.outOfPocket,
                          rebate_amount: result.rebate,
                          calculator_value: Math.round(result.outOfPocket),
                        });
                        handleBookingClick('pricing_calculator_complete');
                      }}
                      className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors duration-200"
                    >
                      {fundingType === 'no-coverage'
                        ? 'Book Session → A$250.00'
                        : `Book at This Cost → A${result.outOfPocket.toFixed(2)}`}
                    </button>

                    <button
                      onClick={() => {
                        setCalculatorStep(1);
                        setSessionType('');
                        setFundingType('');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ← Start Over
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Appointment Types Information */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Appointment Types Available
              </h2>
              <p className="text-xl text-gray-600">
                Different session types for different therapeutic needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {/* Individual Psychology Session */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Individual Psychology Session
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    A$250.00
                  </div>
                  <p className="text-sm text-gray-500">60 minutes</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• One-on-one therapy session</li>
                  <li>• Individual mental health concerns</li>
                  <li>• Anxiety, depression, trauma, life transitions</li>
                  <li>• Medicare rebate eligible with GP referral</li>
                </ul>
              </div>

              {/* Couples Session */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Couples Session
                  </h3>
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    A$300.00
                  </div>
                  <p className="text-sm text-gray-500">60 minutes</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Relationship counselling for couples</li>
                  <li>• Communication and conflict resolution</li>
                  <li>• Both partners attend together</li>
                  <li>• Private health insurance may provide rebate</li>
                </ul>
              </div>

              {/* NDIS Psychology Session */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    NDIS Psychology Session
                  </h3>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    A$232.99
                  </div>
                  <p className="text-sm text-gray-500">60 minutes</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• NDIS provider - direct billing available</li>
                  <li>• Plan-managed or self-managed participants</li>
                  <li>• Fee set by NDIS price guide</li>
                  <li>• Funded through NDIS capacity building budget</li>
                </ul>
              </div>

              {/* Medicare Psychology Session */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Medicare Psychology Session
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    A$250.00
                  </div>
                  <p className="text-sm text-gray-500">
                    60 minutes (with rebate)
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Same session as individual psychology</li>
                  <li>• Medicare rebate of A$98.95 applies</li>
                  <li>• Requires valid GP Mental Health Plan</li>
                  <li>• Up to 10 sessions per calendar year</li>
                </ul>
              </div>

              {/* Professional Supervision */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Professional Supervision
                  </h3>
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    A$250.00
                  </div>
                  <p className="text-sm text-gray-500">60 minutes</p>
                  <div className="mt-2 inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    Psychology professionals only
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    • For psychology students or provisionally registered
                    psychologists seeking supervision
                  </li>
                  <li>• Professional development and case consultation</li>
                  <li>• Meets AHPRA registration requirements</li>
                  <li>
                    • <strong>NOT for general public or therapy clients</strong>
                  </li>
                  <li>
                    • <strong>NOT a therapy session for personal issues</strong>
                  </li>
                </ul>
              </div>

              {/* Online Consultation */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Online Consultation
                  </h3>
                  <div className="text-2xl font-bold text-gray-600 mb-2">
                    Various
                  </div>
                  <p className="text-sm text-gray-500">Flexible duration</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• All sessions conducted via secure telehealth</li>
                  <li>• Same therapeutic effectiveness as in-person</li>
                  <li>• Accessible from anywhere in Australia</li>
                  <li>• Pricing depends on session type selected</li>
                </ul>
              </div>
            </div>

            {/* Funding Types Information */}
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Funding Options Available
              </h2>
              <p className="text-xl text-gray-600">
                Different ways to fund your psychology sessions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Medicare Benefits */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Medicare Benefits
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    A$98.95 rebate
                  </div>
                  <p className="text-sm text-gray-500">
                    Registered Psychologist rebate (Item 80010)
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                  <li>• Requires GP Mental Health Plan</li>
                  <li>• Up to 10 sessions per calendar year</li>
                  <li>• Must be Australian resident with Medicare card</li>
                  <li>• Rebate paid directly to Medicare account</li>
                </ul>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Your cost:</strong> A$250.00 - A$98.95 ={' '}
                  <strong>A$151.05</strong>
                </div>
              </div>

              {/* Private Health Insurance */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Private Health Insurance
                  </h3>
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    Varies
                  </div>
                  <p className="text-sm text-gray-500">
                    Depends on your level of cover
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Many private health policies provide rebates for psychology
                    services, but coverage varies significantly by provider and
                    policy level. Most policies have annual limits ($300-$1,000)
                    and per-session caps.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-medium text-blue-800 mb-2">
                      To check your rebate, contact your insurer with:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Provider type: Registered Psychologist</li>
                      <li>• AHPRA registration: PSY0001971109</li>
                      <li>• Medicare item: 80010</li>
                      <li>
                        • Service type: Psychology consultation (50 minutes)
                      </li>
                      <li>• Session fee: $250 (individual) / $300 (couples)</li>
                    </ul>
                  </div>

                  <p className="text-xs text-gray-600">
                    We provide receipts immediately after each session for you
                    to claim directly with your insurer.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Medibank: 13 23 31</div>
                    <div>BUPA: 134 135</div>
                    <div>HCF: 13 13 31</div>
                    <div>NIB: 13 14 63</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Note:</strong> Cannot combine with Medicare rebate
                </div>
              </div>

              {/* NDIS Funding */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    NDIS Funding
                  </h3>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    Fully funded
                  </div>
                  <p className="text-sm text-gray-500">
                    For eligible participants
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                  <li>• NDIS provider - direct billing available</li>
                  <li>• Funded from Capacity Building budget</li>
                  <li>• Plan-managed or self-managed participants</li>
                  <li>• Fee set by NDIS price guide (A$232.99)</li>
                </ul>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Your cost:</strong> <strong>A$0.00</strong> (if you
                  have NDIS funding)
                </div>
              </div>

              {/* Private Pay */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Private Pay
                  </h3>
                  <div className="text-2xl font-bold text-gray-700 mb-2">
                    Full fee
                  </div>
                  <p className="text-sm text-gray-500">No rebates or funding</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                  <li>• No referrals or paperwork required</li>
                  <li>• Book immediately</li>
                  <li>• Complete privacy (no third party involvement)</li>
                  <li>• Flexible scheduling</li>
                </ul>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Your cost:</strong> Full session fee
                  (A$250.00-A$300.00)
                </div>
              </div>
            </div>

            {/* Book Now Section */}
            <div className="text-center mt-12">
              <button
                onClick={() => handleBookingClick('pricing_information_page')}
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">📅</span>
                </span>
                Book Your Appointment
              </button>
              <p className="mt-4 text-gray-600">
                Choose your appointment type and funding option during booking
              </p>
            </div>
          </div>
        </section>

        {/* Trust & Risk Mitigation Section */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Your Peace of Mind is Our Priority
              </h2>
              <p className="text-xl text-gray-600">
                Professional, secure, and confidential mental health support
              </p>
            </div>

            {/* Trust Signals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Professional Credentials
                </h3>
                <p className="text-gray-600">
                  Registered Psychologist with AHPRA
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure & Confidential
                </h3>
                <p className="text-gray-600">
                  Professional healthcare privacy standards
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Convenient Scheduling
                </h3>
                <p className="text-gray-600">
                  Online booking available through our secure client portal
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Personalized Care
                </h3>
                <p className="text-gray-600">
                  Individual approach tailored to your needs
                </p>
              </div>
            </div>

            {/* Risk Mitigation */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                Service Standards
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">💰</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Clear Pricing
                  </h4>
                  <p className="text-gray-600">
                    Upfront costs with no surprise fees
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">📊</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Transparent Billing
                  </h4>
                  <p className="text-gray-600">
                    No hidden fees or surprise charges
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">✨</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Professional Service
                  </h4>
                  <p className="text-gray-600">
                    Evidence-based therapy approaches
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Common Questions About Pricing
              </h2>
              <p className="text-xl text-gray-600">
                Get clear answers about costs and funding options
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-lg font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    <span
                      className={`text-2xl transition-transform duration-200 ${openFAQ === index ? 'rotate-45' : ''}`}
                    >
                      +
                    </span>
                  </button>

                  {openFAQ === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Final CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Take the Next Step?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Professional mental health support when you need it most
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={() => handleBookingClick()}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <span>Book Your Session Now</span>
                </span>
              </button>

              <button
                onClick={scrollToCalculator}
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <span>🧮</span>
                  <span>Calculate Your Cost First</span>
                </span>
              </button>
            </div>

            <div className="bg-blue-700 bg-opacity-50 rounded-lg p-4 mb-6">
              <p className="text-blue-100 text-sm">
                <strong>Secure booking</strong> •{' '}
                <strong>No commitment required</strong> •{' '}
                <strong>Available 6 days a week</strong>
              </p>
            </div>

            <p className="text-blue-100 text-sm">
              Not sure which option is right for you? Contact us and we'll help
              you choose.
            </p>
          </div>
        </section>
      </div>

      {/* Booking Modal */}
    </>
  );
};

export default Pricing;
