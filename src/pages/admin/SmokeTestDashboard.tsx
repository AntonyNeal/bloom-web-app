import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Server,
  Globe,
  Shield,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message?: string;
  details?: unknown;
  subTests?: TestResult[];
}

interface SmokeTestResponse {
  timestamp: string;
  environment: string;
  overallStatus: 'pass' | 'fail' | 'partial';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  results: {
    api: TestResult[];
    sql: TestResult[];
    cosmos: TestResult[];
    schema: TestResult[];
  };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'skip' | 'running' }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'fail':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'skip':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
  }
}

function TestResultItem({ result, depth = 0 }: { result: TestResult; depth?: number }) {
  const [expanded, setExpanded] = useState(result.status === 'fail');
  const hasSubTests = result.subTests && result.subTests.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div 
        className={`flex items-center gap-3 py-2 ${hasSubTests ? 'cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''}`}
        onClick={() => hasSubTests && setExpanded(!expanded)}
      >
        {hasSubTests && (
          expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <StatusIcon status={result.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${result.status === 'fail' ? 'text-red-700' : 'text-gray-900'}`}>
              {result.name}
            </span>
            <span className="text-xs text-gray-400">
              {result.duration}ms
            </span>
          </div>
          {result.message && (
            <p className={`text-sm ${result.status === 'fail' ? 'text-red-600' : 'text-gray-500'}`}>
              {result.message}
            </p>
          )}
        </div>
      </div>
      
      {expanded && hasSubTests && (
        <div className="mt-1 mb-2">
          {result.subTests!.map((subTest, idx) => (
            <TestResultItem key={idx} result={subTest} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestSection({ 
  title, 
  icon: Icon, 
  results, 
  isLoading 
}: { 
  title: string; 
  icon: React.ElementType;
  results: TestResult[];
  isLoading: boolean;
}) {
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const skipCount = results.filter(r => r.status === 'skip').length;

  const overallStatus = isLoading ? 'running' : 
    failCount > 0 ? 'fail' : 
    skipCount === results.length ? 'skip' : 'pass';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              overallStatus === 'pass' ? 'bg-green-100' :
              overallStatus === 'fail' ? 'bg-red-100' :
              overallStatus === 'skip' ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              <Icon className={`w-5 h-5 ${
                overallStatus === 'pass' ? 'text-green-600' :
                overallStatus === 'fail' ? 'text-red-600' :
                overallStatus === 'skip' ? 'text-yellow-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>
                {isLoading ? 'Running tests...' : `${passCount} passed, ${failCount} failed, ${skipCount} skipped`}
              </CardDescription>
            </div>
          </div>
          <StatusIcon status={overallStatus} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-500">Running tests...</span>
          </div>
        ) : results.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tests to display</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {results.map((result, idx) => (
              <TestResultItem key={idx} result={result} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SmokeTestDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<SmokeTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use Vite proxy for local dev (/api -> bloom-functions-dev.azurewebsites.net)
  // In production, VITE_API_URL is set by CI/CD pipeline
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const runSmokeTests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch(`${apiBaseUrl}/smoke-test`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SmokeTestResponse = await response.json();
      setTestResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run smoke tests');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sage-100 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-lavender-100 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 font-medium transition-all mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smoke Tests</h1>
              <p className="text-gray-600 mt-1">
                Test API endpoints, database connections, and schema integrity
              </p>
            </div>

            <button
              onClick={runSmokeTests}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Smoke Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Error running tests</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Summary Card */}
        {testResults && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    testResults.overallStatus === 'pass' ? 'bg-green-100' :
                    testResults.overallStatus === 'fail' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {testResults.overallStatus === 'pass' ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : testResults.overallStatus === 'fail' ? (
                      <XCircle className="w-8 h-8 text-red-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                      {testResults.overallStatus === 'pass' ? 'All Tests Passed' :
                       testResults.overallStatus === 'fail' ? 'Tests Failed' : 'Partial Success'}
                    </h2>
                    <p className="text-gray-600">
                      Environment: <span className="font-medium">{testResults.environment}</span>
                      {' • '}
                      Duration: <span className="font-medium">{testResults.totalDuration}ms</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testResults.passedTests}</div>
                    <div className="text-sm text-gray-500">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{testResults.failedTests}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{testResults.skippedTests}</div>
                    <div className="text-sm text-gray-500">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{testResults.totalTests}</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                </div>

                <button
                  onClick={runSmokeTests}
                  disabled={isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Re-run tests"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Last run: {new Date(testResults.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TestSection
            title="API Endpoints"
            icon={Globe}
            results={testResults?.results.api || []}
            isLoading={isLoading}
          />
          
          <TestSection
            title="SQL Database"
            icon={Database}
            results={testResults?.results.sql || []}
            isLoading={isLoading}
          />
          
          <TestSection
            title="Cosmos DB"
            icon={Server}
            results={testResults?.results.cosmos || []}
            isLoading={isLoading}
          />
          
          <TestSection
            title="Schema Integrity"
            icon={Shield}
            results={testResults?.results.schema || []}
            isLoading={isLoading}
          />
        </div>

        {/* Initial State */}
        {!testResults && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tests run yet</h3>
            <p className="text-gray-500 mb-6">Click the "Run Smoke Tests" button to test your system</p>
            <button
              onClick={runSmokeTests}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Play className="w-5 h-5" />
              Run Smoke Tests
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmokeTestDashboard;
