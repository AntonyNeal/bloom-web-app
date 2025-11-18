import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface TestResult {
  testName: string;
  displayLabel?: string;
  description?: string;
  variants: {
    [key: string]: {
      allocations: number;
      conversions: number;
      conversionRate: number;
    };
  };
  statisticalSignificance: {
    zScore: number;
    pValue: number;
    isSignificant: boolean;
    confidenceLevel: string;
  };
  improvement: {
    percentage: number;
    winner: string;
  };
  duration?: {
    startedAt: string | null;
    daysRunning: number;
    daysRemaining: number;
    expectedDurationDays: number;
    progressPercentage: number;
    status: string;
  };
}

const ACTIVE_TESTS = [
  'homepage-header-test',
  'hero-cta-test',
  'mobile-touch-test',
  'form-fields-test',
  'trust-badges-test',
];

// Use Azure Function App directly (CORS now enabled)
const AZURE_FUNCTION_URL = 'https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results';

export function ABTestDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // Admin-only redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchTestResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        ACTIVE_TESTS.map((testName) =>
          fetch(`${AZURE_FUNCTION_URL}/${testName}`)
            .then((res) => res.json())
            .then((data) => {
              // Check if the response contains an error
              if (data.error) {
                console.warn(`Test ${testName}: ${data.error}`);
                return null;
              }
              return data;
            })
            .catch((err) => {
              console.error(`Failed to fetch ${testName}:`, err);
              return null;
            })
        )
      );

      const validResults = results.filter((r) => r !== null);
      setTests(validResults);
      setLastUpdated(new Date());

      if (validResults.length === 0) {
        setError('No test data available yet. Tests are being collected.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test results');
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestResults();
    // Poll every 30 seconds
    const interval = setInterval(fetchTestResults, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTest = (testName: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(testName)) {
        next.delete(testName);
      } else {
        next.add(testName);
      }
      return next;
    });
  };

  const handleExport = (testResult: TestResult) => {
    const csv = [
      ['Test:', testResult.testName],
      ['Exported:', new Date().toLocaleString()],
      [''],
      ['Variant', 'Allocations', 'Conversions', 'Conversion Rate', 'Percentage'],
      ...Object.entries(testResult.variants).map(([name, data]) => [
        name,
        data.allocations,
        data.conversions,
        (data.conversionRate * 100).toFixed(2) + '%',
        name === testResult.improvement.winner
          ? 'WINNER +' + testResult.improvement.percentage.toFixed(1) + '%'
          : '',
      ]),
      [''],
      ['Statistical Significance', ''],
      ['Z-Score', testResult.statisticalSignificance.zScore.toFixed(4)],
      ['P-Value', testResult.statisticalSignificance.pValue.toFixed(4)],
      ['Is Significant', testResult.statisticalSignificance.isSignificant ? 'Yes' : 'No'],
      ['Confidence Level', testResult.statisticalSignificance.confidenceLevel],
    ]
      .map((row) => row.map((cell) => (typeof cell === 'string' ? `"${cell}"` : cell)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testResult.testName}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sage-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
              className="text-sage-600 hover:text-sage-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-sage-900">A/B Testing Dashboard</h1>
              <p className="text-sage-600 mt-2">Monitor and analyze active tests</p>
            </div>
            <Button
              onClick={fetchTestResults}
              disabled={loading}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-sage-500 mt-4">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-rose-50 border-rose-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <span>Error loading test results: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tests Grid */}
        {loading && tests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-sage-600">Loading test results...</div>
          </div>
        ) : tests.length === 0 ? (
          <Card className="bg-sage-50 border-sage-200">
            <CardContent className="pt-6">
              <p className="text-sage-700">No test results available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => {
              const isExpanded = expandedTests.has(test.testName);
              
              return (
                <Card
                  key={test.testName}
                  className="border-sage-200 hover:border-sage-300 transition-all duration-200"
                >
                  {/* Collapsed Header - Always Visible */}
                  <CardHeader
                    className="cursor-pointer hover:bg-sage-50 transition-colors"
                    onClick={() => toggleTest(test.testName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Expand/Collapse Icon */}
                        <div className="text-sage-600">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                        
                        {/* Test Name */}
                        <div className="flex-1">
                          <CardTitle className="text-sage-900 text-xl">
                            {test.displayLabel || test.testName}
                          </CardTitle>
                          <CardDescription className="text-sage-600 mt-1 flex items-center gap-3">
                            <span>{test.description || `${test.variants ? Object.keys(test.variants).length : 0} variants`}</span>
                            {test.duration && (
                              <>
                                <span className="text-sage-400">•</span>
                                <span className="font-medium">
                                  Running {test.duration.daysRunning} {test.duration.daysRunning === 1 ? 'day' : 'days'}
                                </span>
                                <span className="text-sage-400">•</span>
                                <span>
                                  {test.duration.daysRemaining} {test.duration.daysRemaining === 1 ? 'day' : 'days'} remaining
                                </span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Summary Metrics - Always Visible */}
                      <div className="flex items-center gap-6 mr-4">
                        <div className="text-center">
                          <p className="text-xs text-sage-600 mb-1">Allocations</p>
                          <p className="text-lg font-bold text-sage-900">
                            {test.variants
                              ? Object.values(test.variants).reduce((sum, v) => sum + v.allocations, 0)
                              : 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-sage-600 mb-1">Conversions</p>
                          <p className="text-lg font-bold text-sage-900">
                            {test.variants
                              ? Object.values(test.variants).reduce((sum, v) => sum + v.conversions, 0)
                              : 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-sage-600 mb-1">Winner</p>
                          <p className="text-sm font-bold text-sage-900">
                            {test.improvement?.winner || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-sage-600 mb-1">Improvement</p>
                          <p className="text-lg font-bold text-green-600">
                            +{test.improvement?.percentage?.toFixed(1) || '0'}%
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          test.statisticalSignificance?.isSignificant
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {test.statisticalSignificance?.isSignificant
                          ? 'Running'
                          : 'Running'}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded Content - Only Visible When Expanded */}
                  {isExpanded && (
                    <CardContent className="space-y-6 pt-0">
                      {/* Duration Progress */}
                      {test.duration && (
                        <div className="bg-sage-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sage-900">Test Duration</h4>
                            <span className="text-sm text-sage-600">
                              {test.duration.progressPercentage}% complete
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-sage-200 rounded-full h-3 mb-3">
                            <div
                              className="bg-sage-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${test.duration.progressPercentage}%` }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-sage-600 mb-1">Started</p>
                              <p className="font-semibold text-sage-900">
                                {test.duration.startedAt 
                                  ? new Date(test.duration.startedAt).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sage-600 mb-1">Days Running</p>
                              <p className="font-semibold text-sage-900">
                                {test.duration.daysRunning} / {test.duration.expectedDurationDays} days
                              </p>
                            </div>
                            <div>
                              <p className="text-sage-600 mb-1">Expected End</p>
                              <p className="font-semibold text-sage-900">
                                {test.duration.startedAt 
                                  ? new Date(
                                      new Date(test.duration.startedAt).getTime() + 
                                      test.duration.expectedDurationDays * 24 * 60 * 60 * 1000
                                    ).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Variant Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sage-900">Variant Performance</h4>
                        <div className="space-y-3">
                          {test.variants &&
                            Object.entries(test.variants).map(([name, data]) => (
                              <div key={name} className="border border-sage-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sage-900">{name}</span>
                                  {name === test.improvement?.winner && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                      WINNER
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-sage-600">Allocations</p>
                                    <p className="font-semibold text-sage-900">{data.allocations}</p>
                                  </div>
                                  <div>
                                    <p className="text-sage-600">Conversions</p>
                                    <p className="font-semibold text-sage-900">{data.conversions}</p>
                                  </div>
                                  <div>
                                    <p className="text-sage-600">Rate</p>
                                    <p className="font-semibold text-sage-900">
                                      {(data.conversionRate * 100).toFixed(2)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {!test.variants && (
                            <p className="text-sage-600 italic">No variant data available</p>
                          )}
                        </div>
                      </div>

                      {/* Statistical Info */}
                      <div className="border-t border-sage-200 pt-4">
                        <h4 className="font-semibold text-sage-900 mb-3">Statistical Analysis</h4>
                        {test.statisticalSignificance ? (
                          <div className="grid grid-cols-3 gap-6 text-lg">
                            <div>
                              <p className="text-sage-600 text-xl font-bold mb-1">
                                Chance This Result Is Random
                              </p>
                              <p className="font-mono font-extrabold text-sage-900 text-3xl">
                                {(test.statisticalSignificance.pValue * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sage-600 text-xl font-bold mb-1">Confidence Level</p>
                              <p className="font-extrabold text-sage-900 text-3xl">
                                {test.statisticalSignificance.confidenceLevel}
                              </p>
                            </div>
                            <div>
                              <p className="text-sage-600 text-xl font-bold mb-1">Status</p>
                              <p
                                className={`font-extrabold text-3xl ${
                                  test.statisticalSignificance.isSignificant
                                    ? 'text-green-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {test.statisticalSignificance.isSignificant
                                  ? 'Not Significant'
                                  : 'Not Significant'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sage-600 italic">Statistical data not available</p>
                        )}
                      </div>

                      {/* Export Button */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleExport(test)}
                          variant="outline"
                          className="border-sage-200 text-sage-600 hover:bg-sage-50"
                        >
                          ↓ Export as CSV
                        </Button>
                        <Button
                          onClick={() => navigate(`/admin/ab-tests/${test.testName}`)}
                          className="bg-sage-600 hover:bg-sage-700 text-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
