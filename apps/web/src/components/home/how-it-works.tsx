import { Search, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react';
export function HowItWorks() {
	return (
		<section className="how" id="como-funciona">
			<div>
				<span className="section-kicker">ASÍ DE SENCILLO</span>
				<h2>Tu próximo setup,<br />con más criterio.</h2>
				<p>Tú eliges el componente. Nosotros te ayudamos a comparar.</p>
			</div>
			<ol>
				<li><Search /><div><span>01 / DESCUBRE</span><h3>Busca tu componente</h3><p>Explora GPU, CPU, monitores y más por categoría.</p></div></li>
				<li><ChartNoAxesCombined /><div><span>02 / COMPARA</span><h3>Compara especificaciones</h3><p>Selecciona dos o más productos y mira sus diferencias.</p></div></li>
				<li><ArrowUpRight /><div><span>03 / COMPRA</span><h3>Ve a Amazon</h3><p>El enlace te lleva a la tienda. Sin cuentas en PrecioFlash.</p></div></li>
			</ol>
		</section>
	);
}
