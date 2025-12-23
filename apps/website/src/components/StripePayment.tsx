import {
  CardElement,
  Elements,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, PaymentRequest } from '@stripe/stripe-js';
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';
import { log } from '../utils/logger';

// Initialize Stripe with your publishable key
// TODO: Replace with your actual Stripe publishable key from environment variables
const stripePromise = loadStripe(
  import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] || ''
);

interface PaymentFormProps {
  amount: number; // Amount in dollars (will be converted to cents)
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  customerEmail: string;
  customerName: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onCancel,
  customerEmail,
  customerName,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  // Set up Payment Request for Google Pay / Apple Pay
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: 'aud',
      total: {
        label: 'Bloom Psychology Appointment',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Google Pay / Apple Pay is available
    pr.canMakePayment().then((result) => {
      log.info('canMakePayment result', 'StripePayment', { result, available: !!result });
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
        log.info('Google Pay / Apple Pay available', 'StripePayment', result);
      } else {
        log.info('Google Pay / Apple Pay NOT available - ensure cards are saved in browser and Google Pay is enabled in Stripe Dashboard', 'StripePayment');
      }
    }).catch((err) => {
      log.error('canMakePayment error', 'StripePayment', err);
    });

    // Handle payment method from Google Pay / Apple Pay
    pr.on('paymentmethod', async (event) => {
      setLoading(true);
      setError('');

      try {
        // Create payment intent on backend
        const response = await apiService.post<{ clientSecret: string }>(
          '/api/create-payment-intent',
          {
            amount: Math.round(amount * 100),
            currency: 'aud',
            customerEmail: event.payerEmail || customerEmail,
            customerName: event.payerName || customerName,
          }
        );

        if (!response.success) {
          event.complete('fail');
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = response.data;

        // Confirm the payment with the payment method from Google Pay / Apple Pay
        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: event.paymentMethod.id },
            { handleActions: false }
          );

        if (confirmError) {
          event.complete('fail');
          setError(confirmError.message || 'Payment failed');
          setLoading(false);
          return;
        }

        event.complete('success');

        if (paymentIntent?.status === 'requires_action') {
          // Handle 3D Secure authentication if needed
          const { error: actionError, paymentIntent: confirmedIntent } =
            await stripe.confirmCardPayment(clientSecret);
          
          if (actionError) {
            setError(actionError.message || 'Authentication failed');
            setLoading(false);
            return;
          }

          // With manual capture, status will be 'requires_capture' instead of 'succeeded'
          if (confirmedIntent?.status === 'succeeded' || confirmedIntent?.status === 'requires_capture') {
            onSuccess(confirmedIntent.id);
          }
        } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
          // With manual capture, status will be 'requires_capture' instead of 'succeeded'
          onSuccess(paymentIntent.id);
        }
      } catch (err) {
        event.complete('fail');
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        setLoading(false);
      }
    });
  }, [stripe, amount, customerEmail, customerName, onSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment intent on your backend
      // This should call your Azure Function that creates a Stripe payment intent
      const response = await apiService.post<{ clientSecret: string }>(
        '/api/create-payment-intent',
        {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'aud',
          customerEmail,
          customerName,
        }
      );

      if (!response.success) {
        log.error(
          'Failed to create payment intent',
          'StripePayment',
          response.error
        );
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = response.data;

      // Confirm the payment with the card details
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName,
              email: customerEmail,
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      // With manual capture, status will be 'requires_capture' instead of 'succeeded'
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  // Temporarily disable payments
  const PAYMENTS_DISABLED = false;

  if (PAYMENTS_DISABLED) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-4 p-6">
        <div className="text-6xl">🔧</div>
        <h3 className="text-xl font-semibold text-slate-700">Payment System Maintenance</h3>
        <p className="text-slate-500 text-center max-w-md">
          Our payment system is temporarily undergoing maintenance. We'll be back up and running shortly!
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 px-6 py-2 text-sm font-semibold rounded-md text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-[1.5vh]">
      {/* Google Pay / Apple Pay Button */}
      {canMakePayment && paymentRequest && (
        <div>
          <label className="block text-[clamp(9px,1.5vh,12px)] font-semibold text-slate-600 mb-[0.5vh] uppercase tracking-wide">
            Express Checkout
          </label>
          <div className="mb-[1vh]">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'default',
                    theme: 'dark',
                    height: '44px',
                  },
                },
              }}
            />
          </div>
          <div className="relative my-[1.5vh]">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[clamp(9px,1.5vh,12px)]">
              <span className="px-3 bg-white text-slate-400">or pay with card</span>
            </div>
          </div>
        </div>
      )}

      {/* Card Element */}
      <div>
        <label className="block text-[clamp(9px,1.5vh,12px)] font-semibold text-slate-600 mb-[0.5vh] uppercase tracking-wide">
          Card Details
        </label>
        <div className="border border-slate-200 rounded-lg p-[1.5vh] bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
        {/* Test mode hint */}
        <p className="text-[clamp(8px,1.2vh,10px)] text-slate-400 mt-[0.5vh]">
          Test mode: <span className="font-mono">4242 4242 4242 4242</span>, any future date, any CVC
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-[1.5vh]">
          <p className="text-red-600 text-[clamp(10px,1.5vh,14px)]">{error}</p>
        </div>
      )}

      {/* Medicare/NDIS Info */}
      <div className="text-[clamp(9px,1.3vh,12px)] text-slate-500 p-[1.5vh] bg-slate-50 rounded-lg border border-slate-100">
        <p>💡 Medicare rebates available with valid GP Mental Health Plan. Receipt provided immediately.</p>
      </div>

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />

      {/* Buttons */}
      <div className="flex justify-between items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-[2vh] py-[1vh] text-[clamp(10px,1.5vh,12px)] font-semibold rounded-md text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
          disabled={loading}
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-[2.5vh] py-[1vh] text-[clamp(10px,1.5vh,12px)] font-semibold rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-4 w-4 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay $${amount.toFixed(2)} →`
          )}
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-1.5 text-[clamp(8px,1.2vh,10px)] text-slate-400">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
};

export const StripePayment: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};
