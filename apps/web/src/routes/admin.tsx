import { useEffect, useState } from 'react';
import type { Route } from './+types/admin';
import { seo } from '@/lib/seo';
import type { Product } from '@/data/products';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Administración — PrecioFlash',
		description: 'Panel de administración del catálogo PrecioFlash.',
		path: '/admin',
		noindex: true,
	});
}

/** Tu etiqueta de asociado. No es secreta: va en los enlaces públicos. */
const TAG = 'carlosanton0b-21';
const HOST = 'www.amazon.es';
const PRODUCTS_PATH = 'apps/web/src/data/products.json';
const CONFIG_KEY = 'pf-admin-config';

const CATEGORIES: [string, string][] = [
	['gpu', 'Tarjetas gráficas'], ['cpu', 'Procesadores'], ['desktop', 'PC gaming'], ['laptop', 'Portátiles gaming'],
	['monitor', 'Monitores'], ['ram', 'Memorias RAM'], ['storage', 'SSD y HDD'], ['motherboard', 'Placas base'],
	['psu', 'Fuentes de alimentación'], ['cooling', 'Refrigeración'], ['case', 'Gabinetes'],
	['peripherals', 'Periféricos gaming'], ['audio', 'Auriculares y audio'],
];

type Config = { owner: string; repo: string; token: string };
type Draft = {
	name: string; brand: string; category: string; model: string; asin: string; image: string;
	description: string; specs: string; productUrl: string; featured: boolean; popular: boolean; status: 'published' | 'draft';
};

const emptyDraft = (): Draft => ({
	name: '', brand: '', category: 'gpu', model: '', asin: '', image: '', description: '', specs: '',
	productUrl: '', featured: false, popular: false, status: 'published',
});

const ASIN_RE = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?=[/?#&]|$)/i;
const asinFromUrl = (raw: string) => raw.match(ASIN_RE)?.[1]?.toUpperCase() ?? '';
const isHttps = (raw: string) => /^https:\/\//.test(raw);
const isAmazonHttps = (raw: string) => {
	try {
		const url = new URL(raw);
		return url.protocol === 'https:' && /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname);
	} catch {
		return false;
	}
};

const withTag = (raw: string) => {
	const url = new URL(raw);
	url.searchParams.set('tag', TAG);
	return url.toString();
};

const parseSpecs = (text: string): Record<string, string> =>
	Object.fromEntries(
		text.split('\n')
			.map(line => line.split(':'))
			.filter(([k, ...rest]) => k.trim() && rest.length)
			.map(([k, ...rest]) => [k.trim().slice(0, 60), rest.join(':').trim().slice(0, 120)]),
	);

/** Valida el formulario y devuelve el producto final, o los errores. */
function build(d: Draft, existing?: Product): { errors: string[]; product?: Product } {
	const errors: string[] = [];
	const name = d.name.trim().slice(0, 200);
	if (!name) errors.push('El nombre es obligatorio.');
	if (!CATEGORIES.some(([id]) => id === d.category)) errors.push('Categoría no válida.');

	const pasted = d.productUrl.trim();
	if (pasted && !isAmazonHttps(pasted)) errors.push('El enlace debe ser https y de amazon.');

	const asin = (d.asin.trim().toUpperCase() || asinFromUrl(pasted));
	if (asin && !/^[A-Z0-9]{10}$/.test(asin)) errors.push('El ASIN debe tener 10 caracteres alfanuméricos.');

	const image = d.image.trim();
	if (image && !isHttps(image)) errors.push('La imagen debe ser una URL https.');

	if (errors.length) return { errors };

	const productUrl = asin ? `https://${HOST}/dp/${asin}` : pasted;
	const affiliateUrl = productUrl ? withTag(productUrl) : '';

	return {
		errors,
		product: {
			...(existing ?? { id: `p-${Date.now().toString(36)}`, price: null, priceCheckedAt: null, previousPrice: null, currency: 'EUR', store: 'Amazon' }),
			name,
			brand: d.brand.trim().slice(0, 100),
			category: d.category,
			model: d.model.trim().slice(0, 100),
			asin,
			image,
			description: d.description.trim().slice(0, 500),
			specs: parseSpecs(d.specs),
			productUrl,
			affiliateUrl,
			featured: d.featured,
			popular: d.popular,
			status: d.status,
		} as Product,
	};
}

const toDraft = (p: Product): Draft => ({
	name: p.name, brand: p.brand ?? '', category: p.category, model: p.model ?? '', asin: p.asin ?? '',
	image: p.image ?? '', description: p.description ?? '',
	specs: Object.entries(p.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
	productUrl: p.asin ? '' : (p.productUrl ?? ''), featured: !!p.featured, popular: !!p.popular,
	status: p.status === 'draft' ? 'draft' : 'published',
});

// UTF-8 <-> base64 para la API de GitHub.
const encode = (text: string) => {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	bytes.forEach(b => { binary += String.fromCharCode(b); });
	return btoa(binary);
};
const decode = (b64: string) => {
	const binary = atob(b64.replace(/\n/g, ''));
	return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
};

async function github(cfg: Config, init: RequestInit = {}) {
	const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${PRODUCTS_PATH}?ref=main`, {
		...init,
		headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${cfg.token}`, ...(init.headers ?? {}) },
	});
	if (!res.ok) {
		const msg = res.status === 401 || res.status === 403 ? 'Token no válido o sin permiso de escritura en este repositorio.'
			: res.status === 404 ? 'No se encuentra el repositorio o el archivo de productos.'
			: res.status === 409 ? 'Hubo un cambio en paralelo. Recarga la lista y vuelve a intentarlo.'
			: `Error de GitHub (${res.status}).`;
		throw new Error(msg);
	}
	return res.json();
}

async function loadProducts(cfg: Config) {
	const json = await github(cfg);
	return { products: JSON.parse(decode(json.content)) as Product[], sha: json.sha as string };
}

async function saveProducts(cfg: Config, products: Product[], sha: string, message: string) {
	const json = await github(cfg, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			message,
			content: encode(`${JSON.stringify(products, null, 2)}\n`),
			sha,
			branch: 'main',
		}),
	});
	return json.content.sha as string;
}

export default function Admin() {
	const [cfg, setCfg] = useState<Config | null>(null);
	const [loginForm, setLoginForm] = useState<Config>({ owner: 'carlos12n459', repo: 'carlos12n459.github.io', token: '' });
	const [products, setProducts] = useState<Product[]>([]);
	const [sha, setSha] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [draft, setDraft] = useState<Draft>(emptyDraft());
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

	const show = (text: string, ok: boolean) => setMsg({ text, ok });

	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') as Config | null;
			if (saved?.token) {
				setCfg(saved);
				void refresh(saved);
			}
		} catch {
			localStorage.removeItem(CONFIG_KEY);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function refresh(c: Config) {
		setBusy(true);
		try {
			const data = await loadProducts(c);
			setProducts(data.products);
			setSha(data.sha);
		} catch (e) {
			show((e as Error).message, false);
		} finally {
			setBusy(false);
		}
	}

	async function login(e: React.FormEvent) {
		e.preventDefault();
		const next = { ...loginForm, owner: loginForm.owner.trim(), repo: loginForm.repo.trim(), token: loginForm.token.trim() };
		setBusy(true);
		try {
			const data = await loadProducts(next);
			localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
			setCfg(next);
			setProducts(data.products);
			setSha(data.sha);
			show('Conectado.', true);
		} catch (err) {
			show((err as Error).message, false);
		} finally {
			setBusy(false);
		}
	}

	function logout() {
		localStorage.removeItem(CONFIG_KEY);
		setCfg(null);
		setProducts([]);
		setSha('');
		setSelectedId(null);
		setDraft(emptyDraft());
	}

	function pick(p: Product | null) {
		setSelectedId(p?.id ?? null);
		setDraft(p ? toDraft(p) : emptyDraft());
		setMsg(null);
	}

	async function save(e: React.FormEvent) {
		e.preventDefault();
		if (!cfg) return;
		const existing = products.find(p => p.id === selectedId);
		const { errors, product } = build(draft, existing);
		if (errors.length || !product) return show(errors.join(' '), false);

		const next = existing
			? products.map(p => (p.id === product.id ? product : p))
			: [...products, product];

		setBusy(true);
		try {
			const newSha = await saveProducts(cfg, next, sha, `${existing ? 'Editar' : 'Añadir'} producto: ${product.name}`);
			setProducts(next);
			setSha(newSha);
			setSelectedId(product.id);
			show('Guardado. La web se actualiza en 1-2 minutos.', true);
		} catch (err) {
			show((err as Error).message, false);
		} finally {
			setBusy(false);
		}
	}

	async function remove() {
		if (!cfg || !selectedId || !confirm('¿Eliminar este producto de la web?')) return;
		const target = products.find(p => p.id === selectedId);
		const next = products.filter(p => p.id !== selectedId);
		setBusy(true);
		try {
			const newSha = await saveProducts(cfg, next, sha, `Eliminar producto: ${target?.name ?? selectedId}`);
			setProducts(next);
			setSha(newSha);
			pick(null);
			show('Eliminado. La web se actualiza en 1-2 minutos.', true);
		} catch (err) {
			show((err as Error).message, false);
		} finally {
			setBusy(false);
		}
	}

	const field = (label: string, input: React.ReactNode) => (
		<label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600 }}>{label}{input}</label>
	);
	const inputStyle: React.CSSProperties = { font: 'inherit', padding: 7, border: '1px solid #c9d2dc', borderRadius: 6 };
	const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(d => ({ ...d, [key]: value }));

	if (!cfg) {
		return (
			<main style={{ maxWidth: 460, margin: '48px auto', padding: 20 }}>
				<h1>Administración</h1>
				<p style={{ fontSize: 14, color: '#5b6772' }}>
					Pega tu token de GitHub (permiso <b>Contents: Read and write</b> solo en este repositorio). Se guarda en este navegador.
				</p>
				<form onSubmit={login} style={{ display: 'grid', gap: 10 }}>
					{field('Usuario de GitHub', <input style={inputStyle} value={loginForm.owner} onChange={e => setLoginForm({ ...loginForm, owner: e.target.value })} />)}
					{field('Repositorio', <input style={inputStyle} value={loginForm.repo} onChange={e => setLoginForm({ ...loginForm, repo: e.target.value })} />)}
					{field('Token', <input type="password" style={inputStyle} value={loginForm.token} onChange={e => setLoginForm({ ...loginForm, token: e.target.value })} required autoComplete="off" />)}
					<button type="submit" disabled={busy} style={{ padding: 10, border: 0, borderRadius: 6, background: '#00a65a', color: '#fff', cursor: 'pointer' }}>
						{busy ? 'Conectando…' : 'Entrar'}
					</button>
					{msg && <p style={{ color: msg.ok ? '#1e8449' : '#c0392b', fontSize: 13 }}>{msg.text}</p>}
				</form>
			</main>
		);
	}

	return (
		<main style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 20, padding: '20px 24px', maxWidth: 1280, margin: '0 auto' }}>
			<section>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
					<h1 style={{ margin: 0, fontSize: 22 }}>Productos ({products.length})</h1>
					<div style={{ display: 'flex', gap: 8 }}>
						<button onClick={() => pick(null)} style={{ padding: '7px 12px', borderRadius: 6, border: 0, background: '#00a65a', color: '#fff', cursor: 'pointer' }}>Nuevo</button>
						<button onClick={logout} style={{ padding: '7px 12px', borderRadius: 6, border: 0, background: '#6b7785', color: '#fff', cursor: 'pointer' }}>Salir</button>
					</div>
				</div>
				<table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 14 }}>
					<thead>
						<tr>{['Nombre', 'Categoría', 'ASIN', 'Estado'].map(h => <th key={h} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e3e8ee' }}>{h}</th>)}</tr>
					</thead>
					<tbody>
						{products.map(p => (
							<tr key={p.id} onClick={() => pick(p)} style={{ cursor: 'pointer', background: p.id === selectedId ? '#e8f5ee' : undefined }}>
								<td style={{ padding: 8, borderBottom: '1px solid #e3e8ee' }}>{p.name}</td>
								<td style={{ padding: 8, borderBottom: '1px solid #e3e8ee' }}>{p.category}</td>
								<td style={{ padding: 8, borderBottom: '1px solid #e3e8ee' }}>{p.asin || '-'}</td>
								<td style={{ padding: 8, borderBottom: '1px solid #e3e8ee' }}>{p.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			<form onSubmit={save} style={{ background: '#fff', padding: 16, borderRadius: 8, display: 'grid', gap: 10, alignContent: 'start' }}>
				<h2 style={{ margin: 0, fontSize: 18 }}>{selectedId ? 'Editar producto' : 'Nuevo producto'}</h2>
				{field('Nombre', <input style={inputStyle} value={draft.name} onChange={e => set('name', e.target.value)} required maxLength={200} />)}
				{field('Marca', <input style={inputStyle} value={draft.brand} onChange={e => set('brand', e.target.value)} />)}
				{field('Categoría', (
					<select style={inputStyle} value={draft.category} onChange={e => set('category', e.target.value)}>
						{CATEGORIES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
					</select>
				))}
				{field('Modelo', <input style={inputStyle} value={draft.model} onChange={e => set('model', e.target.value)} />)}
				{field('ASIN de Amazon', <input style={inputStyle} value={draft.asin} onChange={e => set('asin', e.target.value)} placeholder="B0XXXXXXXX" />)}
				{field('Enlace de Amazon (si no tienes ASIN, pega el enlace del producto)', (
					<input style={inputStyle} value={draft.productUrl} onChange={e => {
						const v = e.target.value;
						set('productUrl', v);
						const found = asinFromUrl(v);
						if (found) set('asin', found);
					}} />
				))}
				{field('URL de imagen (https)', <input style={inputStyle} value={draft.image} onChange={e => set('image', e.target.value)} />)}
				{field('Descripción', <textarea style={{ ...inputStyle, minHeight: 60 }} value={draft.description} onChange={e => set('description', e.target.value)} />)}
				{field('Especificaciones (una por línea: clave: valor)', <textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.specs} onChange={e => set('specs', e.target.value)} />)}
				<label style={{ fontSize: 13 }}><input type="checkbox" checked={draft.featured} onChange={e => set('featured', e.target.checked)} /> Destacado</label>
				<label style={{ fontSize: 13 }}><input type="checkbox" checked={draft.popular} onChange={e => set('popular', e.target.checked)} /> Popular</label>
				{field('Estado', (
					<select style={inputStyle} value={draft.status} onChange={e => set('status', e.target.value as Draft['status'])}>
						<option value="published">Publicado</option>
						<option value="draft">Borrador</option>
					</select>
				))}
				<div style={{ display: 'flex', gap: 8 }}>
					<button type="submit" disabled={busy} style={{ flex: 1, padding: 9, border: 0, borderRadius: 6, background: '#00a65a', color: '#fff', cursor: 'pointer' }}>{busy ? 'Guardando…' : 'Guardar'}</button>
					{selectedId && <button type="button" onClick={remove} disabled={busy} style={{ padding: 9, border: 0, borderRadius: 6, background: '#c0392b', color: '#fff', cursor: 'pointer' }}>Eliminar</button>}
				</div>
				{msg && <p style={{ margin: 0, fontSize: 13, color: msg.ok ? '#1e8449' : '#c0392b' }}>{msg.text}</p>}
				<p style={{ margin: 0, fontSize: 12, color: '#5b6772' }}>El precio y la fecha los pone el bot de Amazon. Aquí solo se guardan los datos del producto.</p>
			</form>
		</main>
	);
}
