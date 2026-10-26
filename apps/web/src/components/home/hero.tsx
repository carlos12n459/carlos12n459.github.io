import { ArrowDown, Search, ShieldCheck, ExternalLink, Zap } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';

const QUICK = ['gpu', 'cpu', 'desktop', 'monitor', 'peripherals'];

export function Hero({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
	return (
		<section className="hero">
			<div className="hero-grid" aria-hidden="true" />
			<div className="hero-content">
				<div className="eyebrow"><span /> ENCUENTRA MÁS. PAGA MENOS.</div>
				<h1>Encuentra los mejores precios<br />para tu próximo <span>setup.</span></h1>
				<p>Compara componentes de PC, computadores y periféricos gaming.<br className="desktop" /> Enlaces directos a Amazon, sin registro ni compras en el sitio.</p>
				<form className="search" onSubmit={e => { e.preventDefault(); document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' }); }}>
					<Search size={22} />
					<input aria-label="Buscar productos" placeholder="¿Qué componente buscas?" value={query} onChange={e => setQuery(e.target.value)} />
					<button type="submit">Buscar ofertas <Search size={17} /></button>
				</form>
				<div className="suggestions">
					Accesos:
					{QUICK.map(id => {
						const c = CATEGORIES.find(x => x.id === id);
						if (!c) return null;
						const Icon = c.icon;
						return (
							<button key={id} onClick={() => { setQuery(''); document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' }); document.dispatchEvent(new CustomEvent('pf:category', { detail: id })); }}>
								<Icon size={13} /> {c.short}
							</button>
						);
					})}
				</div>
				<div className="hero-proof">
					<span><ShieldCheck size={16} /> Sin registro</span>
					<span><ExternalLink size={16} /> Enlaces a Amazon</span>
					<span><Zap size={16} /> Compara en segundos</span>
				</div>
			</div>
			<div className="hero-bottom">
				<span>COMPONENTES. SETUP. MEJORES PRECIOS.</span>
				<a href="#ofertas">Explora el catálogo <ArrowDown size={16} /></a>
			</div>
		</section>
	);
}
