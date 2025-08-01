declare interface Window {
  SERVER_FLAGS: {
    authDisabled: boolean;
    branding: string;

    telemetry?: {
      DEVSANDBOX_SEGMENT_API_KEY: string;
      // All of the following should be always available on prod env.
      SEGMENT_API_HOST: string;

      // One of the following should be always available on prod env.
      SEGMENT_API_KEY: string;
      SEGMENT_JS_HOST: string;
      // Optional override for analytics.min.js script URL
      SEGMENT_JS_URL: string;

      SEGMENT_PUBLIC_API_KEY: string;
    };
  };
}
