/**
 * Panel de administración local de PrecioFlash.
 *
 * Se ejecuta solo en tu PC (127.0.0.1) y edita apps/web/src/data/products.json.
 * Para publicar los cambios: git add / commit / push.
 *
 * Los precios, enlaces de afiliado e imágenes de Amazon NO se editan aquí:
 * los gestiona el bot con la Creators API.
 *
 * Uso: npm run admin   -> abre http://127.0.0.1:4321
 */
import { createServer } from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.resolve(here, '../apps/web/src/data/products.json');
const PAGE_FILE = path.resolve(here, 'admin.html');
const PORT = Number(process.env.ADMIN_PORT ?? 4321);
const HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

/** Tu etiqueta de asociado (ID de tienda). No es secreta: va en los enlaces públicos. */
const AMAZON_TAG = process.env.CREATORS_PARTNER_TAG || 'carlosanton0b-21';
const AMAZON_HOST = 'www.amazon.es';

/** Saca el ASIN de un enlace de producto de Amazon. Devuelve null si no lo tiene. */
function asinFromUrl(raw) {
	const match = String(raw).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?=[\/?#&]|$)/i);
	return match ? match[1].toUpperCase() : null;
}

/**
 * Enlace de afiliado a partir del ASIN o de un enlace de Amazon pegado.
 * Con ASIN: /dp/ASIN?tag=... Sin ASIN: el enlace pegado con tu tag.
 */
function buildAffiliate(asin, productUrl) {
	if (asin) return `https://${AMAZON_HOST}/dp/${asin}?tag=${AMAZON_TAG}`;
	if (!productUrl) return '';
	const url = new URL(productUrl);
	url.searchParams.set('tag', AMAZON_TAG);
	return url.toString();
}

const CATEGORY_IDS = [
	'gpu', 'cpu', 'desktop', 'laptop', 'monitor', 'ram', 'storage', 'motherboard',
	'psu', 'cooling', 'case', 'peripherals', 'audio',
];
const STATUSES = ['published', 'draft'];

const isHttps = raw => {
	try {
		return new URL(raw).protocol === 'https:';
	} catch {
		return false;
	}
};
const isAmazonHttps = raw => {
	try {
		const url = new URL(raw);
		return url.protocol === 'https:' && /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname);
	} catch {
		return false;
	}
};

const parseSpecs = text =>
	Object.fromEntries(
		String(text ?? '')
			.split('\n')
			.map(line => line.split(':'))
			.filter(([k, ...rest]) => k?.trim() && rest.length)
			.map(([k, ...rest]) => [k.trim().slice(0, 60), rest.join(':').trim().slice(0, 120)]),
	);

/** Valida y normaliza los campos que el administrador puede escribir. */
function sanitize(input, existing = {}) {
	const errors = [];
	const str = (key, max) => String(input[key] ?? existing[key] ?? '').trim().slice(0, max);

	const name = str('name', 200);
	if (!name) errors.push('El nombre es obligatorio.');

	const category = str('category', 30);
	if (!CATEGORY_IDS.includes(category)) errors.push('Categoría no válida.');

	const pastedUrl = str('productUrl', 500);
	if (pastedUrl && !isAmazonHttps(pastedUrl)) errors.push('El enlace del producto debe ser https y de amazon.');

	// Si no escribiste el ASIN, se saca del enlace pegado (/dp/ASIN o /gp/product/ASIN).
	let asin = str('asin', 10).toUpperCase();
	if (!asin && pastedUrl) asin = asinFromUrl(pastedUrl) ?? '';
	if (asin && !/^[A-Z0-9]{10}$/.test(asin)) errors.push('El ASIN debe tener 10 caracteres alfanuméricos.');

	const image = str('image', 500);
	if (image && !isHttps(image)) errors.push('La imagen debe ser una URL https.');

	// Con ASIN, el enlace queda limpio en /dp/ASIN; sin ASIN se usa el que pegaste.
	const productUrl = asin ? `https://${AMAZON_HOST}/dp/${asin}` : pastedUrl;

	const status = str('status', 10) || 'draft';
	if (!STATUSES.includes(status)) errors.push('Estado no válido.');

	const specs = input.specs !== undefined ? parseSpecs(input.specs) : existing.specs ?? {};

	// Si hay ASIN, el enlace del producto se arma solo. Si no, se usa el que pegaste.
	const finalProductUrl = productUrl || (asin ? `https://${AMAZON_HOST}/dp/${asin}` : '');
	let affiliateUrl = '';
	try {
		affiliateUrl = buildAffiliate(asin, finalProductUrl);
	} catch {
		errors.push('El enlace del producto no es una URL válida.');
	}

	return {
		errors,
		product: {
			...existing,
			name,
			brand: str('brand', 100),
			category,
			model: str('model', 100),
			asin,
			image,
			description: str('description', 500),
			specs,
			productUrl: finalProductUrl,
			affiliateUrl,
			featured: Boolean(input.featured ?? existing.featured),
			popular: Boolean(input.popular ?? existing.popular),
			status,
		},
	};
}

async function loadProducts() {
	return JSON.parse(await readFile(PRODUCTS_FILE, 'utf8'));
}

async function saveProducts(products) {
	const tmp = `${PRODUCTS_FILE}.tmp`;
	await writeFile(tmp, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
	await rename(tmp, PRODUCTS_FILE);
}

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
	res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
	res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

async function readBody(req) {
	let raw = '';
	for await (const chunk of req) {
		raw += chunk;
		if (raw.length > 100_000) throw new Error('Petición demasiado grande.');
	}
	return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
	try {
		// Evita que una web externa use el panel desde tu navegador (DNS rebinding).
		if (!HOSTS.has(req.headers.host ?? '')) return send(res, 403, { error: 'Host no permitido.' });

		const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);

		if (req.method === 'GET' && url.pathname === '/') {
			return send(res, 200, await readFile(PAGE_FILE, 'utf8'), 'text/html; charset=utf-8');
		}

		if (url.pathname === '/api/products' && req.method === 'GET') {
			return send(res, 200, await loadProducts());
		}

		if (url.pathname === '/api/products' && req.method === 'POST') {
			const { errors, product } = sanitize(await readBody(req));
			if (errors.length) return send(res, 400, { error: errors.join(' ') });
			const products = await loadProducts();
			product.id = `p-${Date.now().toString(36)}`;
			product.added = new Date().toISOString();
			products.push(product);
			await saveProducts(products);
			return send(res, 201, product);
		}

		const match = url.pathname.match(/^\/api\/products\/([\w-]+)$/);
		if (match) {
			const id = match[1];
			const products = await loadProducts();
			const index = products.findIndex(p => p.id === id);
			if (index === -1) return send(res, 404, { error: 'Producto no encontrado.' });

			if (req.method === 'PUT') {
				const { errors, product } = sanitize(await readBody(req), products[index]);
				if (errors.length) return send(res, 400, { error: errors.join(' ') });
				products[index] = product;
				await saveProducts(products);
				return send(res, 200, product);
			}

			if (req.method === 'DELETE') {
				products.splice(index, 1);
				await saveProducts(products);
				return send(res, 200, { ok: true });
			}
		}

		return send(res, 404, { error: 'No encontrado.' });
	} catch (error) {
		return send(res, 500, { error: error.message });
	}
});

server.listen(PORT, '127.0.0.1', () => {
	console.log(`Panel de administración: http://127.0.0.1:${PORT}`);
	console.log('Para publicar los cambios: git add . ; git commit ; git push');
	console.log('Pulsa Ctrl+C para cerrarlo.');
});
