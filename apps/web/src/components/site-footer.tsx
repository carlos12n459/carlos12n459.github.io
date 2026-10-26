import { openCookiePreferences } from '@/lib/cookie-consent';
export function SiteFooter() {
	return (
		<footer className="site-footer">
			<div className="footer-top">
				<div>
					<a href="/" className="footer-brand">Precio<span>Flash.</span></a>
					<p>Encuentra más. Paga menos.</p>
				</div>
				<div>
					<a href="#ofertas">Explorar catálogo</a>
					<a href="#como-funciona">Cómo funciona</a>
					<a href="/como-ganamos">Cómo ganamos dinero</a>
					<a href="/privacidad">Política de privacidad</a>
					<a href="/terminos">Términos de uso</a>
					<button onClick={openCookiePreferences}>Configurar cookies</button>
				</div>
			</div>
			<div className="transparency" id="transparencia">
				<b>Aviso de afiliación.</b> PrecioFlash participa en el programa de afiliados Amazon Associates. Como Asociado de Amazon, PrecioFlash obtiene ingresos por compras calificadas. Esto no implica que Amazon patrocine, respalde o administre PrecioFlash. Los precios y la disponibilidad se consultan en Amazon en el momento de la compra.
				<p style={{ margin: '8px 0 0' }}><b>As an Amazon Associate I earn from qualifying purchases.</b></p>
			</div>
			<div className="footer-bottom">
				<span>© 2026 PrecioFlash</span>
				<span>Comparamos componentes de PC y gaming. No vendemos productos.</span>
			</div>
		</footer>
	);
}
