import type { Route } from './+types/privacidad';
import { seo } from '@/lib/seo';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Política de privacidad — PrecioFlash',
		description: 'Qué datos trata PrecioFlash, para qué y cómo puedes ejercer tus derechos.',
		path: '/privacidad',
	});
}

export default function Privacidad() {
	return (
		<main className="legal-page" style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px', lineHeight: 1.6 }}>
			<h1>Política de privacidad</h1>
			<p>Última actualización: [FECHA]</p>
			<h2>Responsable</h2>
			<p>[NOMBRE O RAZÓN SOCIAL], [DIRECCIÓN], contacto: [EMAIL].</p>
			<h2>Datos que tratamos</h2>
			<p>
				PrecioFlash no pide registro a los visitantes ni recoge datos personales para mostrar el catálogo.
				Si utilizas el formulario de contacto o te suscribes a un boletín, trataremos los datos que nos facilites
				solo para responderte o enviarte la comunicación que hayas pedido.
			</p>
			<h2>Cookies</h2>
			<p>
				Usamos cookies técnicas y, si lo aceptas, cookies de medición. Puedes cambiar tu elección en cualquier momento
				con el botón «Configurar cookies» del pie de página.
			</p>
			<h2>Enlaces a Amazon</h2>
			<p>
				Al hacer clic en un enlace de Amazon, te diriges a un sitio de Amazon, que aplica su propia política de privacidad.
			</p>
			<h2>Tus derechos</h2>
			<p>
				Puedes solicitar acceso, rectificación, supresión, oposición o limitación escribiendo a [EMAIL].
				También puedes presentar una reclamación ante la autoridad de control competente.
			</p>
		</main>
	);
}
