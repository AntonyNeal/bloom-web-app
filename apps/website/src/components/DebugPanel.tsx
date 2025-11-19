// Import environment utilities
import { getEnvBool, isAzureStaticWebApps } from '../utils/env';
import React from 'react';

interface WindowWithGlobals extends Window {
  __ENV_VARS__?: Record<string, string>;
  [key: string]: unknown;
}

// Import build info with fallback for development
import { BUILD_INFO } from '../build-info';

const DebugPanel: React.FC = () => {
  // Visibility rules:
  // - explicit VITE_DEBUG_PANEL => show everywhere (explicit opt-in)
  // - otherwise, URL/localStorage opt-in only allowed in development mode
  const explicitDebug = getEnvBool('VITE_DEBUG_PANEL');
  // Treat Azure preview/hosted static sites as production even if built with MODE=development
  // or BUILD_INFO indicates development. Only allow URL/localStorage opt-in when
  // running locally in dev.
  const builtAsDev = BUILD_INFO && BUILD_INFO.viteMode === 'development';
  const isDevMode =
    (import.meta.env.MODE === 'development' || builtAsDev) &&
    !isAzureStaticWebApps();
  const urlOptIn =
    window.location.search.includes('debug=true') ||
    window.location.search.includes('showDebug=true');
  const localOptIn = localStorage.getItem('showDebugPanel') === 'true';
  const shouldShow = explicitDebug || (isDevMode && (urlOptIn || localOptIn));

  if (!shouldShow) {
    // Do not render any persistent control when debug panel is disabled.
    return null;
  }

  return (
    <div
      style={{
        background: '#fff3cd',
        border: '3px solid #ffc107',
        padding: '15px',
        margin: '20px 10px',
        fontFamily: 'monospace',
        fontSize: '13px',
        maxHeight: '70vh',
        overflow: 'auto',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#dc3545',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
        onClick={() => {
          localStorage.removeItem('showDebugPanel');
          window.location.reload();
        }}
        title="Click to hide debug panel"
      >
        DEBUG ✕
      </div>
      <strong style={{ color: '#007bff' }}>
        {BUILD_INFO.gitBranch} | {BUILD_INFO.viteMode}
      </strong>
      <br />
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
        🌍 Git Branch | Vite Mode
      </div>
      <br />
      <strong style={{ color: '#28a745', fontSize: '12px' }}>
        📊 Build {BUILD_INFO.iteration} |{' '}
        {new Date(parseInt(BUILD_INFO.time)).toLocaleString()}
      </strong>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
        📊 Build Iteration | Build Date (Local Timezone)
      </div>
      <br />

      {(() => {
        // Get global variables from window
        const win = window as unknown as WindowWithGlobals;
        const globalEnvVars = win.__ENV_VARS__ || {};
        const individualGlobals: Record<string, string> = {};

        // Collect individual global variables that start with VITE_
        if (typeof window !== 'undefined') {
          Object.keys(win).forEach((key) => {
            if (key.startsWith('VITE_') && win[key] !== undefined) {
              individualGlobals[key] = String(win[key]);
            }
          });
        }

        const allGlobalVars = { ...globalEnvVars, ...individualGlobals };
        const globalVarKeys = Object.keys(allGlobalVars).sort();

        if (globalVarKeys.length === 0) {
          return (
            <div
              style={{
                marginBottom: '2px',
                color: '#dc2626',
                fontStyle: 'italic',
                background: '#f8d7da',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #f5c6cb',
              }}
            >
              ⚠️ No global environment variables found
            </div>
          );
        }

        return (
          <>
            {/* Individual global variables */}
            {Object.keys(individualGlobals).length > 0 && (
              <>
                <br />
                <strong style={{ color: '#dc3545', fontSize: '14px' }}>
                  🌐 Individual Globals:
                </strong>
                <br />
                {Object.keys(individualGlobals)
                  .sort()
                  .map((key) => (
                    <div
                      key={key}
                      style={{
                        marginBottom: '4px',
                        marginLeft: '15px',
                        color: '#dc3545',
                        background: '#f8d7da',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #f5c6cb',
                      }}
                    >
                      <strong>{key}:</strong>{' '}
                      {individualGlobals[key]
                        ? `"${individualGlobals[key]}"`
                        : 'undefined'}
                    </div>
                  ))}
              </>
            )}
            <br />
          </>
        );
      })()}
    </div>
  );
};

export default DebugPanel;
