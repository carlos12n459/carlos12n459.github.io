import { Zap, ArrowUpRight } from 'lucide-react';
export function SiteHeader() {
	return (
		<header className="site-header">
			<a className="logo" href="/" aria-label="PrecioFlash, inicio">
				<svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
					<path d="M22 7 38 16v17L22 42 6 33V16L22 7Zm0 0v17m16-8-16 8L6 16m16 8v18" stroke="currentColor" strokeWidth="2" />
					<circle cx="22" cy="7" r="4" fill="currentColor" />
					<circle cx="6" cy="16" r="4" fill="currentColor" />
					<circle cx="38" cy="16" r="4" fill="currentColor" />
					<circle cx="22" cy="24" r="4" fill="currentColor" />
				</svg>
				<span>Precio<span>Flash</span><i /></span>
			</a>
			<nav aria-label="Navegación principal">
				<a href="#ofertas">Ofertas</a>
				<a href="#como-funciona">Cómo funciona</a>
				<a href="/admin">Admin</a>
			</nav>
			<a className="header-action" href="#ofertas"><Zap size={16} /> Explorar catálogo <ArrowUpRight size={16} /></a>
		</header>
	);
}
