// src/config/environment.ts
export type Environment = 'development' | 'staging' | 'production';

const env = import.meta.env.MODE as Environment;

export const config = {
  apiUrl:
    env === 'production'
      ? 'https://api.lifepsychology.com.au'
      : env === 'staging'
        ? 'https://api-staging.lifepsychology.com.au'
        : 'https://api-dev.lifepsychology.com.au',
  halaxyWidgetUrl:
    env === 'production'
      ? 'https://halaxy.com/prod-widget'
      : env === 'staging'
        ? 'https://halaxy.com/staging-widget'
        : 'https://halaxy.com/dev-widget',
  googleAnalyticsId: import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  googleAdsId: import.meta.env.VITE_GOOGLE_ADS_ID || 'AW-XXXXXXXXX',
  googleAdsConversionId:
    import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID || 'XXXXXXXXX',
  environment: env,
};
