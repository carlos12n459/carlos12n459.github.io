import type { Config } from '@react-router/dev/config';

// Sitio estático: se genera HTML en build y se publica en GitHub Pages.
export default {
	appDirectory: 'src',
	buildDirectory: '../../dist/apps/web',
	ssr: false,
	prerender: ['/', '/privacidad', '/terminos', '/como-ganamos'],
} satisfies Config;
