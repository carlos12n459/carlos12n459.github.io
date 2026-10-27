/**
 * Bot de precios de PrecioFlash (Creators API de Amazon).
 *
 * Qué hace en cada ejecución:
 * 1. Consulta por ASIN los productos del catálogo (products.json) y toma el precio "Nuevo" más bajo.
 * 2. Busca productos nuevos con scripts/search-queries.json y añade los que tengan oferta válida.
 * 3. Escribe el resultado en apps/web/src/data/offers.generated.json (no se versiona).
 *
 * Reglas que cumple (políticas de Amazon Associates):
 * - El precio se lee de la API en cada ejecución; nunca se escribe a mano.
 * - Cada precio lleva la fecha y hora de su consulta (priceCheckedAt).
 * - Si no hay oferta válida, se retira el precio y el enlace de afiliado.
 * - El precio anterior solo se toma de la API (savingBasis), nunca se inventa.
 * - El enlace de afiliado debe ser HTTPS, de un dominio amazon y llevar tu tag.
 * - Si la API falla, se retiran todas las ofertas en vez de mostrar datos antiguos.
 * - Los títulos se limpian de HTML antes de publicarse.
 *
 * Uso: node scripts/update-prices.mjs [--dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getItems, searchItems } from './creators-api.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.resolve(here, '../apps/web/src/data/products.json');
const OUTPUT_FILE = path.resolve(here, '../apps/web/src/data/offers.generated.json');
const QUERIES_FILE = path.resolve(here, 'search-queries.json');
const DRY_RUN = process.argv.includes('--dry-run');

const CATEGORY_IDS = new Set([
	'gpu', 'cpu', 'desktop', 'laptop', 'monitor', 'ram', 'storage', 'motherboard',
	'psu', 'cooling', 'case', 'peripherals', 'audio',
]);
const MAX_NEW_PER_RUN = 40;
const BATCH_SIZE = 10;

const log = (...args) => console.log(new Date().toISOString(), ...args);

function readConfig() {
	const env = process.env;
	return {
		credentialId: env.CREATORS_CREDENTIAL_ID ?? '',
		credentialSecret: env.CREATORS_CREDENTIAL_SECRET ?? '',
		version: env.CREATORS_VERSION || '3.2',
		partnerTag: env.CREATORS_PARTNER_TAG || '',
		marketplace: env.CREATORS_MARKETPLACE || 'www.amazon.es',
	};
}

function hasCredentials(config) {
	return Boolean(config.credentialId && config.credentialSecret && config.partnerTag);
}

/** HTTPS, dominio de Amazon y con tu etiqueta de asociado. */
function isValidAffiliateUrl(raw, partnerTag) {
	try {
		const url = new URL(raw);
		return (
			url.protocol === 'https:' &&
			/(^|\.)amazon\.[a-z.]+$/i.test(url.hostname) &&
			url.searchParams.get('tag') === partnerTag
		);
	} catch {
		return false;
	}
}

const cleanText = (value, max = 200) =>
	String(value ?? '')
		.replace(/<[^>]*>/g, '')
		.replace(/[<>"'`]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, max);

const httpsImage = raw => (typeof raw === 'string' && /^https:\/\//.test(raw) ? raw : '');

/** Mejor oferta "Nueva" disponible del item, o null si no hay ninguna válida. */
function bestOffer(item, config) {
	const listings = item.offersV2?.listings ?? [];
	const candidates = listings.filter(
		l =>
			l.condition?.value === 'New' &&
			(l.price?.money?.amount ?? 0) > 0 &&
			!['OUT_OF_STOCK', 'UNAVAILABLE'].includes(l.availability?.type) &&
			l.violatesMAP !== true,
	);
	if (candidates.length === 0) return null;

	const best = candidates.reduce((a, b) => (b.price.money.amount < a.price.money.amount ? b : a));
	const price = best.price.money.amount;
	const basis = best.price.savingBasis;
	const previousPrice =
		basis && ['LIST_PRICE', 'WAS_PRICE'].includes(basis.savingBasisType) && basis.money?.amount > price
			? basis.money.amount
			: null;

	if (!isValidAffiliateUrl(item.detailPageURL ?? '', config.partnerTag)) return null;

	return {
		price,
		currency: best.price.money.currency || 'EUR',
		previousPrice,
		affiliateUrl: item.detailPageURL,
		image: httpsImage(item.images?.primary?.large?.url ?? item.images?.primary?.medium?.url),
	};
}

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/**
 * Quita el precio cuando no hay oferta válida. No toca el enlace de afiliado:
 * el que armó el admin con tu tag sigue siendo válido aunque no haya precio.
 */
function retired(product) {
	return { id: product.id, price: null, priceCheckedAt: null, previousPrice: null };
}

async function main() {
	const config = readConfig();
	const products = JSON.parse(await readFile(PRODUCTS_FILE, 'utf8'));
	const now = new Date().toISOString();
	const credentialsOk = hasCredentials(config);
	const entries = [];
	let errors = 0;

	if (!credentialsOk) {
		log('Sin credenciales de la Creators API: se retiran todas las ofertas.');
	}

	// 1. Actualizar productos del catálogo por ASIN.
	const withAsin = products.filter(p => p.asin?.trim());
	const itemsByAsin = new Map();
	if (credentialsOk) {
		try {
			for (const batch of chunks(withAsin.map(p => p.asin.trim()), BATCH_SIZE)) {
				for (const item of await getItems(config, batch)) itemsByAsin.set(item.asin, item);
			}
		} catch (error) {
			errors += 1;
			log(`ERROR GetItems: ${error.message}`);
			itemsByAsin.clear();
		}
	}

	let refreshed = 0;
	for (const product of products) {
		const item = product.asin ? itemsByAsin.get(product.asin.trim()) : undefined;
		const offer = item ? bestOffer(item, config) : null;
		if (!offer) {
			entries.push(retired(product));
			continue;
		}
		refreshed += 1;
		entries.push({
			id: product.id,
			price: offer.price,
			currency: offer.currency,
			previousPrice: offer.previousPrice,
			affiliateUrl: offer.affiliateUrl,
			priceCheckedAt: now,
			...(offer.image ? { image: offer.image } : {}),
		});
	}
	log(`Productos del catálogo con oferta válida: ${refreshed} de ${products.length}.`);

	// 2. Buscar productos nuevos según search-queries.json.
	let added = 0;
	if (credentialsOk) {
		const known = new Set(products.map(p => p.asin?.trim()).filter(Boolean));
		const queries = JSON.parse(await readFile(QUERIES_FILE, 'utf8'));

		for (const query of queries) {
			if (added >= MAX_NEW_PER_RUN) break;
			if (!CATEGORY_IDS.has(query.category)) {
				log(`Categoría no válida en search-queries.json: ${query.category}`);
				continue;
			}
			try {
				const items = await searchItems(config, { keywords: query.keywords, searchIndex: query.searchIndex });
				for (const item of items) {
					if (added >= MAX_NEW_PER_RUN) break;
					if (!item.asin || known.has(item.asin)) continue;
					const offer = bestOffer(item, config);
					if (!offer) continue;

					known.add(item.asin);
					added += 1;
					entries.push({
						id: `auto-${item.asin}`,
						asin: item.asin,
						name: cleanText(item.itemInfo?.title?.displayValue),
						brand: cleanText(item.itemInfo?.byLineInfo?.brand?.displayValue, 100),
						category: query.category,
						model: '',
						image: offer.image,
						description: '',
						specs: {},
						price: offer.price,
						priceCheckedAt: now,
						currency: offer.currency,
						store: 'Amazon',
						productUrl: offer.affiliateUrl,
						affiliateUrl: offer.affiliateUrl,
						previousPrice: offer.previousPrice,
						featured: false,
						popular: false,
						status: 'published',
						added: now,
					});
				}
			} catch (error) {
				errors += 1;
				log(`ERROR SearchItems "${query.keywords}": ${error.message}`);
			}
		}
	}
	log(`Productos nuevos añadidos: ${added}.`);

	if (DRY_RUN) {
		log(`--dry-run: se habrían escrito ${entries.length} entradas.`);
	} else {
		await writeFile(OUTPUT_FILE, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
		log(`Escrito ${OUTPUT_FILE} (${entries.length} entradas).`);
	}

	// Un fallo con credenciales válidas debe verse en la ejecución (GitHub avisa por correo).
	if (credentialsOk && errors > 0) process.exitCode = 1;
}

main().catch(error => {
	log(`ERROR: ${error.message}`);
	process.exitCode = 1;
});
