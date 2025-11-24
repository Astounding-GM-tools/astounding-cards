import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://d8601c45a8868deadac0e821f9620954@o4510420436844544.ingest.de.sentry.io/4510420444250192',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
