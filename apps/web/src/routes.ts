import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('admin', 'routes/admin.tsx'),
	route('privacidad', 'routes/privacidad.tsx'),
	route('terminos', 'routes/terminos.tsx'),
	route('como-ganamos', 'routes/como-ganamos.tsx'),
] satisfies RouteConfig;
