import type { Route } from './+types/terminos';
import { seo } from '@/lib/seo';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Términos de uso — PrecioFlash',
		description: 'Condiciones de uso del comparador PrecioFlash y de sus enlaces a Amazon.',
		path: '/terminos',
	});
}

export default function Terminos() {
	return (
		<main className="legal-page" style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px', lineHeight: 1.6 }}>
			<h1>Términos de uso</h1>
			<p>Última actualización: [FECHA]</p>
			<h2>Objeto</h2>
			<p>
				PrecioFlash es un servicio informativo que compara componentes de PC. No vende productos, no tramita pedidos
				y no es parte en las compras que se realizan en Amazon.
			</p>
			<h2>Precios y disponibilidad</h2>
			<p>
				La información de precio puede no estar actualizada. El precio final, los gastos de envío y la disponibilidad
				son los que muestre Amazon en el momento de la compra.
			</p>
			<h2>Enlaces de afiliado</h2>
			<p>
				Algunos enlaces son de afiliado. Como Asociado de Amazon, PrecioFlash obtiene ingresos por compras calificadas.
				Esto no afecta al precio que pagas.
			</p>
			<h2>Uso aceptable</h2>
			<p>No puedes usar el sitio para extraer datos de forma masiva ni para actividades ilegales.</p>
			<h2>Responsabilidad</h2>
			<p>
				Hacemos lo posible por mantener la información correcta, pero no garantizamos su exactitud ni su disponibilidad
				continua. Las decisiones de compra son tuyas.
			</p>
			<h2>Contacto</h2>
			<p>[EMAIL]</p>
		</main>
	);
}
