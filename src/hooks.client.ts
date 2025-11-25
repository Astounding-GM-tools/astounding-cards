import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { dev } from '$app/environment';

// Determine environment based on PUBLIC_R2_PATH_PREFIX or Vite's dev mode
const isDev = dev || import.meta.env.PUBLIC_R2_PATH_PREFIX === 'dev';
const environment = isDev ? 'development' : 'production';

// Only initialize Sentry in production (for now)
// Once you have a test server, you can adjust this logic
const sentryDsn = isDev
	? undefined // Don't report errors in development
	: 'https://d8601c45a8868deadac0e821f9620954@o4510420436844544.ingest.de.sentry.io/4510420444250192';

Sentry.init({
	dsn: sentryDsn,
	environment: environment,
	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Higher sample rate in production, lower in development
	replaysSessionSampleRate: isDev ? 1.0 : 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [replayIntegration()],

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
	sendDefaultPii: true
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
