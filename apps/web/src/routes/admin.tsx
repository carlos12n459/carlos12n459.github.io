import type { Route } from './+types/admin';
import { seo } from '@/lib/seo';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Administración — PrecioFlash',
		description: 'Panel de administración del catálogo PrecioFlash.',
		path: '/admin',
		noindex: true,
	});
}

export default function Admin() {
	return (
		<main style={{ maxWidth: 560, margin: '48px auto', padding: 20, lineHeight: 1.6 }}>
			<h1>Administración</h1>
			<p>
				La gestión de productos se hace desde tu PC con <code>npm run admin</code> y luego
				<code> git push</code>. Esta página no guarda cambios.
			</p>
		</main>
	);
}
