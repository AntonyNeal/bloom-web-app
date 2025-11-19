import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Shield, Users, ArrowRight } from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'scale' | 'yesno';
  options?: string[];
  scaleLabels?: [string, string];
}

interface BookingOption {
  title: string;
  description: string;
  link: string;
  primary: boolean;
}

interface AssessmentResult {
  score: number;
  recommendations: {
    level: 'High' | 'Moderate' | 'Low';
    message: string;
    actions: string[];
  };
  completedAt: string;
}

const Assessment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<AssessmentResult | null>(null);

  // Assessment questions based on common mental health screening
  const questions: AssessmentQuestion[] = [
    {
      id: 'mood',
      question:
        'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?',
      type: 'scale',
      scaleLabels: ['Not at all', 'Nearly every day'],
    },
    {
      id: 'anxiety',
      question:
        'Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?',
      type: 'scale',
      scaleLabels: ['Not at all', 'Nearly every day'],
    },
    {
      id: 'sleep',
      question: 'How would you rate your sleep quality over the past month?',
      type: 'scale',
      scaleLabels: ['Very poor', 'Excellent'],
    },
    {
      id: 'energy',
      question: 'How often do you feel tired or have low energy?',
      type: 'scale',
      scaleLabels: ['Not at all', 'Nearly every day'],
    },
    {
      id: 'concentration',
      question:
        'How often do you have trouble concentrating or making decisions?',
      type: 'scale',
      scaleLabels: ['Not at all', 'Nearly every day'],
    },
    {
      id: 'social',
      question: 'How often do you feel isolated or disconnected from others?',
      type: 'scale',
      scaleLabels: ['Not at all', 'Nearly every day'],
    },
    {
      id: 'stress',
      question: 'How would you rate your current stress levels?',
      type: 'scale',
      scaleLabels: ['Very low', 'Very high'],
    },
    {
      id: 'support',
      question: 'Do you have someone you can talk to about your feelings?',
      type: 'yesno',
    },
    {
      id: 'changes',
      question: 'Have you experienced any major life changes recently?',
      type: 'yesno',
    },
    {
      id: 'help',
      question: 'Are you currently seeking help for mental health concerns?',
      type: 'yesno',
    },
  ];

  const handleAnswer = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeAssessment();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeAssessment = () => {
    // Calculate results based on answers
    const score = calculateScore();
    const recommendations = generateRecommendations(score);

    setResults({
      score,
      recommendations,
      completedAt: new Date().toISOString(),
    });
    setIsCompleted(true);
  };

  const calculateScore = (): number => {
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach((question) => {
      if (question.type === 'scale') {
        const answer = answers[question.id];
        if (typeof answer === 'number') {
          totalScore += answer;
          maxScore += 4; // Assuming 0-4 scale
        }
      } else if (question.type === 'yesno') {
        const answer = answers[question.id];
        if (answer === 'yes') {
          totalScore += 1;
        }
        maxScore += 1;
      }
    });

    return Math.round((totalScore / maxScore) * 100);
  };

  const generateRecommendations = (
    score: number
  ): AssessmentResult['recommendations'] => {
    if (score < 30) {
      return {
        level: 'Low' as const,
        message:
          'Your responses suggest you may be experiencing minimal mental health concerns.',
        actions: [
          'Continue practicing good self-care habits',
          'Consider speaking with a trusted friend or family member',
          'Monitor your mental health regularly',
        ],
      };
    } else if (score < 60) {
      return {
        level: 'Moderate' as const,
        message:
          'Your responses suggest you may be experiencing some mental health concerns that could benefit from professional support.',
        actions: [
          'Consider booking an appointment with a mental health professional',
          'Practice stress-reduction techniques like mindfulness or exercise',
          'Reach out to support services if needed',
        ],
      };
    } else {
      return {
        level: 'High' as const,
        message:
          'Your responses suggest you may be experiencing significant mental health concerns. Professional support is recommended.',
        actions: [
          'Book an appointment with a mental health professional as soon as possible',
          'Contact emergency services if you are in crisis (24/7: 000)',
          'Reach out to Lifeline (24/7: 13 11 14) for immediate support',
        ],
      };
    }
  };

  const resetAssessment = () => {
    setCurrentStep(0);
    setAnswers({});
    setIsCompleted(false);
    setResults(null);
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (isCompleted && results) {
    const getBookingOptions = (
      level: 'High' | 'Moderate' | 'Low'
    ): BookingOption[] => {
      switch (level) {
        case 'High':
          return [
            {
              title: 'Priority Consultation',
              description:
                'Book an urgent appointment with our registered psychologist',
              link: '/appointments?priority=high',
              primary: true,
            },
            {
              title: 'Telehealth Session',
              description:
                'Speak with a psychologist remotely from the comfort of your home',
              link: '/appointments?type=telehealth',
              primary: false,
            },
          ];
        case 'Moderate':
          return [
            {
              title: 'Initial Consultation',
              description:
                'Schedule a comprehensive assessment with our psychologists',
              link: '/appointments',
              primary: true,
            },
            {
              title: 'Group Session',
              description: 'Join our supportive group therapy sessions',
              link: '/appointments?type=group',
              primary: false,
            },
          ];
        case 'Low':
          return [
            {
              title: 'Wellness Check',
              description: 'Book a general mental health check-up',
              link: '/appointments?type=wellness',
              primary: true,
            },
            {
              title: 'Information Session',
              description: 'Learn more about our mental health services',
              link: '/appointments?type=info',
              primary: false,
            },
          ];
      }
    };

    const bookingOptions = getBookingOptions(results.recommendations.level);
    const riskLevelColors: Record<'High' | 'Moderate' | 'Low', string> = {
      High: 'bg-red-100 text-red-800',
      Moderate: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Assessment Complete
              </h1>
              <p className="text-gray-600">
                Thank you for completing your mental health assessment
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Results
              </h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {results.score}%
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${riskLevelColors[results.recommendations.level]}`}
                >
                  {results.recommendations.level} Risk Level
                </span>
                <p className="text-gray-600 mt-4">
                  {results.recommendations.message}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recommended Actions
              </h3>
              <ul className="space-y-2">
                {results.recommendations.actions.map(
                  (action: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{action}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {bookingOptions.map((option, index) => (
                <Link
                  key={index}
                  to={option.link}
                  className={`block p-6 rounded-lg transition-all ${
                    option.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <h4 className="text-lg font-semibold mb-2">{option.title}</h4>
                  <p
                    className={
                      option.primary ? 'text-blue-100' : 'text-gray-600'
                    }
                  >
                    {option.description}
                  </p>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/appointments"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book an Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={resetAssessment}
                className="block mt-4 mx-auto text-gray-600 hover:text-gray-800 underline"
              >
                Take Assessment Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mental Health Assessment
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Take the first step towards better mental health with our
            confidential assessment
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Clock className="mx-auto h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">
                10-15 Minutes
              </h3>
              <p className="text-sm text-gray-600">
                Quick and easy to complete
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Shield className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">
                100% Confidential
              </h3>
              <p className="text-sm text-gray-600">
                Your responses are private and secure
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Users className="mx-auto h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">
                Personalized Results
              </h3>
              <p className="text-sm text-gray-600">
                Get tailored recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentStep + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === 'scale' && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>{currentQuestion.scaleLabels?.[0]}</span>
                  <span>{currentQuestion.scaleLabels?.[1]}</span>
                </div>
                <div className="flex justify-center space-x-4">
                  {[0, 1, 2, 3, 4].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleAnswer(currentQuestion.id, value)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
                        answers[currentQuestion.id] === value
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                </div>
              </div>
            )}

            {currentQuestion.type === 'yesno' && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 'yes')}
                  className={`px-8 py-3 rounded-lg border-2 transition-all ${
                    answers[currentQuestion.id] === 'yes'
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 'no')}
                  className={`px-8 py-3 rounded-lg border-2 transition-all ${
                    answers[currentQuestion.id] === 'no'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-300 hover:border-red-400'
                  }`}
                >
                  No
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={answers[currentQuestion.id] === undefined}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === questions.length - 1
                ? 'Complete Assessment'
                : 'Next'}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-600">
          <p className="mb-4">
            This assessment is for informational purposes only and is not a
            substitute for professional medical advice.
          </p>
          <p>
            If you're experiencing a mental health crisis, please contact
            emergency services (000) or Lifeline (13 11 14).
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
