import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { isHydrationError, reportHydrationError } from 'virtual:horizons-runtime';

function onRecoverableError(error: unknown, errorInfo: { componentStack?: string }) {
	try {
		if (isHydrationError(error)) {
			reportHydrationError({ error, componentStack: errorInfo?.componentStack });

			return;
		}
	} catch {
		reportError(error);

		return;
	}

	reportError(error);
}

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
		{ onRecoverableError },
	);
});
