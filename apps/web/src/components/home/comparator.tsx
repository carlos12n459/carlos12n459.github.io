import { useState } from 'react';
import { X, ExternalLink, GitCompare, Trash2 } from 'lucide-react';
import { categorySpecs, categoryName } from '@/data/categories';
import { currentPrice, formatPrice, hasAffiliate, outboundUrl, AFFILIATE_REL, type Product } from '@/data/products';

export function Comparator({ products, onRemove, onClear }: {
	products: Product[];
	onRemove: (id: string) => void;
	onClear: () => void;
}) {
	const [open, setOpen] = useState(false);

	if (products.length === 0) return null;

	const cat = products[0]?.category;
	const specFields = cat ? categorySpecs(cat) : [];

	return (
		<>
			<div className="compare-bar">
				<GitCompare size={18} />
				<span>{products.length} producto(s) seleccionado(s)</span>
				<button className="compare-go" onClick={() => setOpen(true)} disabled={products.length < 2}>Comparar</button>
				<button className="compare-clear" onClick={onClear}>Limpiar</button>
			</div>

			{open && products.length >= 2 && (
				<div className="modal-backdrop" onClick={() => setOpen(false)}>
					<section className="offer-modal" role="dialog" aria-modal="true" aria-label="Comparador de componentes" onClick={e => e.stopPropagation()} style={{ maxWidth: 820, maxHeight: '92dvh', overflow: 'auto' }}>
						<button className="close-modal" onClick={() => setOpen(false)} aria-label="Cerrar comparador"><X /></button>
						<span className="demo-label">COMPARADOR PRECIOFLASH</span>
						<h2>Comparación de componentes</h2>
						<p>Datos del catálogo. Los precios aparecen solo cuando están verificados.</p>
						<div style={{ overflowX: 'auto' }}>
							<table className="spec-table">
								<thead>
									<tr>
										<th>Producto</th>
										{products.map(p => (
											<th key={p.id}>
												<div className="compare-product-head">
													<b>{p.name}</b>
													<span>{p.brand}</span>
													<button onClick={() => onRemove(p.id)} style={{ background: 'none', border: 0, color: '#b03a3a', fontSize: 10, marginTop: 4, cursor: 'pointer' }}>
														<Trash2 size={12} /> Quitar
													</button>
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									<tr><td className="label">Categoría</td>{products.map(p => <td key={p.id}>{categoryName(p.category)}</td>)}</tr>
									{specFields.map(f => (
										<tr key={f.key}>
											<td className="label">{f.label}</td>
											{products.map(p => <td key={p.id}>{p.specs?.[f.key] || '—'}</td>)}
										</tr>
									))}
									<tr>
										<td className="label">Precio</td>
										{products.map(p => <td key={p.id}>{formatPrice(currentPrice(p), p.currency) || <span className="price-consult">Consultar en Amazon</span>}</td>)}
									</tr>
									<tr>
										<td className="label">Enlace</td>
										{products.map(p => (
											<td key={p.id}>
												{outboundUrl(p) ? (
													<a href={outboundUrl(p)} target="_blank" rel={AFFILIATE_REL} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#008b47', fontWeight: 700, fontSize: 11 }}>
														{hasAffiliate(p) ? 'Ver en Amazon' : 'Consultar'} <ExternalLink size={13} />
													</a>
												) : '—'}
											</td>
										))}
									</tr>
								</tbody>
							</table>
						</div>
						<small>La compra se realiza en Amazon. PrecioFlash no tramita pedidos. Los enlaces de afiliado conservan sus parámetros de seguimiento. No se afirma que un componente sea más potente sin datos que lo respalden.</small>
					</section>
				</div>
			)}
		</>
	);
}
