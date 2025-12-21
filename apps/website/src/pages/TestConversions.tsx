import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  fireGoogleAdsConversion,
  fireGA4PurchaseEvent,
  fireGA4BookingCompletedEvent,
  fireClarityEvent,
  captureGCLID,
  getStoredGCLID,
  storeBookingIntent,
  getBookingIntent,
  fireAllConversionEvents,
  ConversionResult,
  BookingData,
} from '../utils/conversionTracking';
import { trackBookingStart, trackBookingComplete } from '../tracking';

/**
 * Test Conversions Page
 * Testing page for conversion tracking
 * Accessible with ?test_key=bloom2025 in production
 */

const TestConversions = () => {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [gclid, setGclid] = useState<string | null>(null);
  const [bookingIntent, setBookingIntent] = useState<BookingData | null>(null);
  const [dataLayerContent, setDataLayerContent] = useState<unknown[]>([]);
  const [ga4Results, setGa4Results] = useState<string[]>([]);

  // Allow access in dev OR with secret URL parameter in production
  const urlParams = new URLSearchParams(window.location.search);
  const hasTestKey = urlParams.get('test_key') === 'bloom2025';
  
  if (!import.meta.env.DEV && !hasTestKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            This page requires authentication.
          </p>
        </div>
      </div>
    );
  }

  // Fire begin_checkout directly via gtag
  const handleFireBeginCheckout = () => {
    console.log('🧪 Testing GA4 begin_checkout event...');
    const result = trackBookingStart({ entry_point: 'test_page' });
    setGa4Results(prev => [...prev, `begin_checkout: ${result.success ? '✅ Success' : '❌ Failed'}`]);
  };

  // NEW: Fire purchase directly via gtag
  const handleFirePurchase = () => {
    console.log('🧪 Testing GA4 purchase event...');
    const result = trackBookingComplete({
      bookingId: `test_${Date.now()}`,
      booking_value: 250,
      transaction_id: `test_txn_${Date.now()}`,
    });
    setGa4Results(prev => [...prev, `purchase: ${result.success ? '✅ Success' : '❌ Failed'}`]);
  };

  const handleFireGoogleAds = async () => {
    console.log('🧪 Testing Google Ads conversion...');
    const result = await fireGoogleAdsConversion();
    setResults((prev) => [...prev, result]);
  };

  const handleFireGA4Purchase = async () => {
    console.log('🧪 Testing GA4 purchase event...');
    const result = await fireGA4PurchaseEvent();
    setResults((prev) => [...prev, result]);
  };

  const handleFireGA4Booking = async () => {
    console.log('🧪 Testing GA4 booking_completed event...');
    const result = await fireGA4BookingCompletedEvent();
    setResults((prev) => [...prev, result]);
  };

  const handleFireClarity = async () => {
    console.log('🧪 Testing Microsoft Clarity event...');
    const result = await fireClarityEvent();
    setResults((prev) => [...prev, result]);
  };

  const handleFireAll = async () => {
    console.log('🧪 Testing all conversion events...');
    const allResults = await fireAllConversionEvents();
    setResults(allResults);
  };

  const handleCheckGCLID = () => {
    const stored = getStoredGCLID();
    setGclid(stored);
    console.log('Stored GCLID:', stored);
  };

  const handleCaptureGCLID = () => {
    captureGCLID();
    const stored = getStoredGCLID();
    setGclid(stored);
    console.log('Captured and stored GCLID:', stored);
  };

  const handleStoreBookingIntent = () => {
    storeBookingIntent({
      source: 'test',
      medium: 'manual',
      campaign: 'test_conversion_page',
    });
    const intent = getBookingIntent();
    setBookingIntent(intent);
    console.log('Stored booking intent:', intent);
  };

  const handleCheckBookingIntent = () => {
    const intent = getBookingIntent();
    setBookingIntent(intent);
    console.log('Current booking intent:', intent);
  };

  const handleCheckDataLayer = () => {
    if (window.dataLayer) {
      setDataLayerContent([...window.dataLayer]);
      console.log('DataLayer contents:', window.dataLayer);
    } else {
      console.warn('DataLayer not found');
      setDataLayerContent([]);
    }
  };

  const handleClearResults = () => {
    setResults([]);
  };

  const handleCheckGtagStatus = () => {
    const hasGtag = typeof window.gtag === 'function';
    const hasDataLayer = Array.isArray(window.dataLayer);
    const hasClarity = typeof window.clarity === 'function';

    console.log('📊 Tracking Status:');
    console.log('  gtag available:', hasGtag);
    console.log('  dataLayer available:', hasDataLayer);
    console.log('  Microsoft Clarity available:', hasClarity);

    if (hasDataLayer) {
      console.log('  dataLayer length:', window.dataLayer.length);
    }
  };

  return (
    <>
      <Helmet>
        <title>Test Conversions | Development Only</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-yellow-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h2 className="text-lg font-bold text-yellow-800">
                  Development Mode Only
                </h2>
                <p className="text-sm text-yellow-700">
                  This page is only accessible in development. Check the browser
                  console for detailed logs.
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Conversion Tracking Test Page
          </h1>

          {/* Status Checks */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleCheckGtagStatus}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Check Tracking Status (see console)
              </button>
              <button
                onClick={handleCheckDataLayer}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Dump dataLayer Contents
              </button>
            </div>
          </div>

          {/* Individual Conversion Tests */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Individual Conversion Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleFireBeginCheckout}
                className="px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                🛒 Fire begin_checkout (GA4)
              </button>
              <button
                onClick={handleFirePurchase}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                💰 Fire purchase (GA4)
              </button>
              <button
                onClick={handleFireGoogleAds}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                🎯 Fire Google Ads Conversion
              </button>
              <button
                onClick={handleFireGA4Purchase}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                🛒 Fire GA4 Purchase (Legacy)
              </button>
              <button
                onClick={handleFireGA4Booking}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                📋 Fire GA4 Booking Completed
              </button>
              <button
                onClick={handleFireClarity}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                👁️ Fire Microsoft Clarity Event
              </button>
            </div>
            
            {/* GA4 Results */}
            {ga4Results.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">GA4 Event Results:</h3>
                {ga4Results.map((result, i) => (
                  <div key={i} className="text-sm text-gray-600">{result}</div>
                ))}
              </div>
            )}
          </div>

          {/* All Conversions Test */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Complete Conversion Sequence
            </h2>
            <button
              onClick={handleFireAll}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg"
            >
              🚀 Fire All Conversions (Simulates Booking Success)
            </button>
          </div>

          {/* GCLID Management */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              GCLID Management
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleCaptureGCLID}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Capture GCLID from URL
              </button>
              <button
                onClick={handleCheckGCLID}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Check Stored GCLID
              </button>
              {gclid && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm font-mono text-teal-900">
                    <strong>Stored GCLID:</strong> {gclid}
                  </p>
                </div>
              )}
              {!gclid && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    No GCLID stored. Add ?gclid=test123 to URL and click
                    "Capture GCLID from URL"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Intent Management */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Booking Intent Management
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleStoreBookingIntent}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                Store Test Booking Intent
              </button>
              <button
                onClick={handleCheckBookingIntent}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                Check Stored Booking Intent
              </button>
              {bookingIntent && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <pre className="text-xs font-mono text-orange-900 overflow-x-auto">
                    {JSON.stringify(bookingIntent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Test Results</h2>
              {results.length > 0 && (
                <button
                  onClick={handleClearResults}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Results
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  No test results yet. Click a button above to fire a conversion
                  event.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      result.success
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {result.eventType}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          result.success
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {result.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-2">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DataLayer Display */}
          {dataLayerContent.length > 0 && (
            <div className="bg-gray-900 text-gray-100 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">DataLayer Contents</h2>
              <pre className="text-xs font-mono overflow-x-auto bg-gray-800 p-4 rounded">
                {JSON.stringify(dataLayerContent, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              Testing Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-900">
              <li>Open browser console (F12) to see detailed logs</li>
              <li>
                Click "Check Tracking Status" to verify gtag and dataLayer are
                loaded
              </li>
              <li>Test individual conversions or fire all at once</li>
              <li>Check results appear both in the UI and console</li>
              <li>Verify events in GA4 Realtime (may take a few seconds)</li>
              <li>Google Ads conversions may take up to 3 hours to appear</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestConversions;
