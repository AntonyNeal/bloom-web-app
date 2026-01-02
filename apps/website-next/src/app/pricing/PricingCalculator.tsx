'use client';

import { useState } from 'react';
import { useBooking } from '@/components/providers';

const sessionOptions = [
  { value: 'individual', label: 'Individual Session', price: 'A$250.00', description: 'One-on-one therapy session' },
  { value: 'couples', label: 'Couples Session', price: 'A$300.00', description: 'Relationship counselling' },
  { value: 'ndis', label: 'NDIS Session', price: 'A$232.99', description: 'Self/plan-managed participants only' },
];

const fundingOptions = [
  { value: 'medicare', label: 'Medicare (with GP referral)', description: 'Up to $98.95 rebate' },
  { value: 'private', label: 'Private Health Insurance', description: 'Rebate varies by fund' },
  { value: 'no-coverage', label: 'No Coverage Available', description: 'Full private payment' },
];

export function PricingCalculator() {
  const [sessionType, setSessionType] = useState('individual');
  const [fundingType, setFundingType] = useState('medicare');
  const [step, setStep] = useState(1);
  const { openBookingModal } = useBooking('pricing_calculator');

  const calculateCost = () => {
    const prices: Record<string, number> = { individual: 250, couples: 300, ndis: 232.99 };
    const basePrice = prices[sessionType];

    if (sessionType === 'ndis') return { outOfPocket: 0, rebate: basePrice };
    if (fundingType === 'medicare' && sessionType !== 'couples') return { outOfPocket: basePrice - 98.95, rebate: 98.95 };
    if (fundingType === 'private') return { outOfPocket: basePrice - 100, rebate: 100 };
    return { outOfPocket: basePrice, rebate: 0 };
  };

  const result = calculateCost();

  return (
    <section id="cost-calculator" className="py-12 lg:py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Find Out What You&apos;ll Actually Pay</h2>
          <p className="text-xl text-gray-600">Get your personalised cost in under 30 seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
          {/* Progress */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-center text-gray-900">What type of session do you need?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSessionType(option.value); setStep(option.value === 'ndis' ? 3 : 2); }}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-2xl font-bold text-blue-600 mt-2">{option.price}</div>
                    <div className="text-sm text-gray-600 mt-2">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-center text-gray-900">How would you like to fund your session?</h3>
              {sessionType === 'couples' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">ℹ️ Medicare rebates only apply to individual sessions. Couples therapy is not covered.</p>
                </div>
              )}
              <div className="space-y-4">
                {fundingOptions.filter(o => !(sessionType === 'couples' && o.value === 'medicare')).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFundingType(option.value); setStep(3); }}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Personalised Cost</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Session Fee:</span>
                    <span className="font-semibold">A${sessionType === 'individual' ? '250.00' : sessionType === 'couples' ? '300.00' : '232.99'}</span>
                  </div>
                  {result.rebate > 0 && (
                    <div className="flex justify-between items-center text-lg text-green-600">
                      <span>Rebate:</span>
                      <span className="font-bold">-A${result.rebate.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold text-gray-900">You pay:</span>
                      <span className="text-3xl font-bold text-blue-600">A${result.outOfPocket.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button onClick={() => openBookingModal('pricing_calculator_complete')} className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors">
                  Book at This Cost → A${result.outOfPocket.toFixed(2)}
                </button>
                <button onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-700 font-medium">← Start Over</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
