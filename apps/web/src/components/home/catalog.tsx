import { useEffect, useState } from 'react';
import { ArrowUpRight, Zap, SlidersHorizontal, X, LayoutGrid, GitCompare, ExternalLink } from 'lucide-react';
import productsData from '@/data/products.json';
import { CATEGORIES, categorySpecs, categoryName } from '@/data/categories';
import { currentPrice, formatCheckedAt, formatPrice, hasAffiliate, outboundUrl, AFFILIATE_REL, type Product } from '@/data/products';
import { Comparator } from '@/components/home/comparator';

const records = (productsData as unknown as Product[]).filter(p => p.status === 'published');

const verifiedDiscount = (p: Product): number | null => {
	const price = currentPrice(p);
	if (price && p.previousPrice && p.previousPrice > price) {
		return Math.round((1 - price / p.previousPrice) * 100);
	}
	return null;
};

export function Catalog({ query, category, setCategory, reset }: {
	query: string;
	category: string | null;
	setCategory: (v: string | null) => void;
	reset: () => void;
}) {
	const [sort, setSort] = useState('featured');
	const [compareIds, setCompareIds] = useState<string[]>([]);

	useEffect(() => {
		const handler = (e: Event) => {
			const id = (e as CustomEvent).detail as string;
			setCategory(id);
		};
		document.addEventListener('pf:category', handler);
		return () => document.removeEventListener('pf:category', handler);
	}, [setCategory]);

	const normalize = (v: string) => v.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
	const filtered = records.filter(p =>
		(!category || p.category === category) &&
		normalize(`${p.name} ${p.brand} ${p.model}`).includes(normalize(query)),
	);
	const sorted = [...filtered].sort((a, b) => {
		if (sort === 'price') return (currentPrice(a) ?? Infinity) - (currentPrice(b) ?? Infinity);
		if (sort === 'price-desc') return (currentPrice(b) ?? -Infinity) - (currentPrice(a) ?? -Infinity);
		if (sort === 'newest') return (b.added || '').localeCompare(a.added || '');
		return Number(b.featured) - Number(a.featured) || Number(b.popular) - Number(a.popular);
	});

	const selected = records.filter(p => compareIds.includes(p.id));
	const toggleCompare = (id: string) => setCompareIds(prev =>
		prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 4 ? prev : [...prev, id],
	);

	return (
		<>
			<section className="catalog" id="ofertas">
				<div className="category-heading">
					<h2>Componentes para tu setup</h2>
					<span>Explora por categoría</span>
				</div>
				<div className="categories">
					<button aria-pressed={!category} className={!category ? 'active' : ''} onClick={() => setCategory(null)}>
						<LayoutGrid size={21} /> Todas
					</button>
					{CATEGORIES.map(({ id, name, icon: Icon }) => (
						<button key={id} aria-pressed={category === id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>
							<Icon size={21} /> {name}
						</button>
					))}
				</div>

				<div className="offers-heading">
					<div>
						<div className="section-kicker"><Zap size={15} /> CATÁLOGO PRECIOFLASH</div>
						<h2>Precios que merecen un clic<span>.</span></h2>
						<p>Compara componentes y ve a Amazon cuando te encaje.</p>
					</div>
					<label className="sort">
						<SlidersHorizontal size={16} />
						<select aria-label="Ordenar productos" value={sort} onChange={e => setSort(e.target.value)}>
							<option value="featured">Destacados primero</option>
							<option value="newest">Novedades</option>
							<option value="price">Menor precio</option>
							<option value="price-desc">Mayor precio</option>
						</select>
					</label>
				</div>

				<div className="demo-notice">
					<span className="demo-label">MODO DEMO</span> Los precios se consultan en Amazon y solo se muestran si se consultaron en las últimas 24 horas. Los enlaces abren búsquedas en Amazon, no ofertas verificadas.
				</div>

				{query && (
					<p className="results" aria-live="polite">
						{sorted.length} resultados para «{query}» <button onClick={reset}>Limpiar filtros</button>
					</p>
				)}

				<div className="product-grid">
					{sorted.map(p => {
						const price = formatPrice(currentPrice(p), p.currency);
						const checkedAt = formatCheckedAt(p.priceCheckedAt);
						const discount = verifiedDiscount(p);
						const url = outboundUrl(p);
						return (
							<article className="product" key={p.id}>
								<div className="product-image">
									{p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#aab' }}><LayoutGrid size={32} /></div>}
									{discount && <span className="discount">−{discount}%</span>}
									{hasAffiliate(p) && <span className="badge-affil">AFILIADO</span>}
									<span className="image-demo">DEMO</span>
								</div>
								<div className="product-content">
									<span className="product-tag"><Zap size={12} /> {categoryName(p.category)}</span>
									<div className="product-brand">{p.brand}{p.model ? ` · ${p.model}` : ''}</div>
									<h3>{p.name}</h3>
									<div className="product-specs">
										{categorySpecs(p.category).slice(0, 2).map(s => p.specs?.[s.key] ? <span key={s.key}>{s.label}: {p.specs[s.key]}</span> : null)}
									</div>
									<div className="price-row">
										{price ? <strong>{price}</strong> : <span className="price-consult">Consultar precio en Amazon</span>}
									</div>
									{price && checkedAt && <p style={{ fontSize: 11, color: '#677078', margin: '2px 0 0' }}>Precio consultado el {checkedAt}</p>}
									<div className="store">en <b>{p.store || 'Amazon'}</b></div>
									{url ? (
										<a className="offer-button" href={url} target="_blank" rel={AFFILIATE_REL}>
											{hasAffiliate(p) ? 'Ver en Amazon' : 'Consultar precio'} <ArrowUpRight size={18} />
										</a>
									) : (
										<button className="offer-button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Enlace no configurado</button>
									)}
									{url && <p style={{ fontSize: 11, color: '#677078', margin: '6px 0 0' }}>Como Asociado de Amazon, PrecioFlash gana con compras calificadas.</p>}
									<button
										className={`compare-toggle ${compareIds.includes(p.id) ? 'active' : ''}`}
										onClick={() => toggleCompare(p.id)}
										aria-pressed={compareIds.includes(p.id)}
									>
										<GitCompare size={14} /> {compareIds.includes(p.id) ? 'En comparación' : 'Comparar'}
									</button>
								</div>
							</article>
						);
					})}
				</div>

				{sorted.length === 0 && (
					<div className="empty">
						<LayoutGrid size={32} />
						<h3>No hay productos para esta búsqueda.</h3>
						<p>Prueba con otra categoría o explora todo el catálogo.</p>
						<button className="offer-button" onClick={reset}>Ver todo el catálogo</button>
					</div>
				)}
				<p className="catalog-footnote">Los precios y la disponibilidad finales se consultan en Amazon. PrecioFlash no tramita pedidos ni pagos.</p>
			</section>

			<Comparator products={selected} onRemove={toggleCompare} onClear={() => setCompareIds([])} />
		</>
	);
}
