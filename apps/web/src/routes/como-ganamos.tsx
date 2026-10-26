import type { Route } from './+types/como-ganamos';
import { seo } from '@/lib/seo';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Cómo ganamos dinero — PrecioFlash',
		description: 'PrecioFlash es un comparador de componentes de PC. Explicamos el programa de afiliados de Amazon y por qué los precios se consultan en Amazon.',
		path: '/como-ganamos',
	});
}

export default function ComoGanamos() {
	return (
		<main className="legal-page" style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px', lineHeight: 1.6 }}>
			<h1>Cómo ganamos dinero</h1>
			<p>PrecioFlash es un comparador de componentes de PC. No vendemos productos ni tramitamos pagos.</p>
			<h2>Programa de afiliados de Amazon</h2>
			<p>
				Participamos en el programa de afiliados Amazon Associates. Cuando haces clic en un enlace de Amazon desde PrecioFlash
				y compras algo calificado, podemos recibir una comisión. El precio que pagas no cambia.
			</p>
			<p><b>As an Amazon Associate I earn from qualifying purchases.</b></p>
			<h2>Precios</h2>
			<p>
				Los precios y la disponibilidad pertenecen a Amazon y pueden cambiar en cualquier momento. Mostramos un precio solo
				cuando se ha consultado recientemente; en caso contrario, te indicamos que lo consultes en Amazon.
			</p>
			<h2>Nuestra independencia</h2>
			<p>
				Las comisiones no determinan qué productos aparecen ni cómo se comparan. Amazon no patrocina ni respalda PrecioFlash.
			</p>
		</main>
	);
}
