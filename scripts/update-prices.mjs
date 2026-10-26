/**
 * Bot de precios de PrecioFlash.
 *
 * Reglas (ver políticas de Amazon Associates):
 * - El precio se lee de la API en cada ejecución; nunca se escribe a mano.
 * - Cada precio lleva la fecha y hora de su consulta (`priceCheckedAt`).
 * - Si la consulta falla, o el producto no tiene oferta válida, se retira el precio y el enlace de afiliado.
 * - El precio anterior (`previousPrice`) solo se toma de la API; nunca se inventa.
 * - Solo se aceptan enlaces HTTPS a dominios de Amazon.
 * - Las credenciales llegan por variables de entorno (secretos de GitHub), nunca en el código.
 *
 * Uso: node scripts/update-prices.mjs [--dry-run]
 * Escribe apps/web/src/data/products.json y no toca el repositorio.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.resolve(here, '../apps/web/src/data/products.json');
const DRY_RUN = process.argv.includes('--dry-run');

/** Máximo de ASIN por petición y pausa entre peticiones, para respetar el límite de solicitudes. */
const BATCH_SIZE = 10;
const PAUSE_MS = 1100;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const log = (...args) => console.log(new Date().toISOString(), ...args);

const isAmazonUrl = raw => {
	try {
		const url = new URL(raw);
		return url.protocol === 'https:' && /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname);
	} catch {
		return false;
	}
};

/**
 * Llamada real a la Creators API (GetItems).
 *
 * PENDIENTE: implementar con el SDK oficial de Node.js de la Creators API
 * (se descarga como zip desde la documentación de Associates Central). Debe
 * devolver un Map asin -> { price, currency, previousPrice, affiliateUrl }
 * usando solo lo que devuelve la API. Hasta entonces lanza error, y el bot
 * retira todas las ofertas en vez de mostrar datos antiguos.
 */
async function fetchAmazonItems(asins, config) {
	void asins;
	void config;
	throw new Error('Adaptador de la Creators API no implementado (ver scripts/update-prices.mjs).');
}

function readConfig() {
	const env = process.env;
	return {
		credentialId: env.CREATORS_CREDENTIAL_ID ?? '',
		credentialSecret: env.CREATORS_CREDENTIAL_SECRET ?? '',
		version: env.CREATORS_VERSION ?? '',
		partnerTag: env.CREATORS_PARTNER_TAG ?? '',
		marketplace: env.CREATORS_MARKETPLACE ?? 'www.amazon.es',
	};
}

function hasCredentials(config) {
	return Boolean(config.credentialId && config.credentialSecret && config.version && config.partnerTag);
}

/** Quita la oferta de un producto: precio, fecha, precio anterior y enlace de afiliado. */
function retireOffer(product) {
	return { ...product, price: null, priceCheckedAt: null, previousPrice: null, affiliateUrl: '' };
}

async function main() {
	const products = JSON.parse(await readFile(PRODUCTS_FILE, 'utf8'));
	const config = readConfig();
	const now = new Date().toISOString();

	const withAsin = products.filter(p => p.asin && p.asin.trim());
	log(`Productos: ${products.length}. Con ASIN: ${withAsin.length}.`);

	let results = new Map();
	let apiError = null;

	if (!hasCredentials(config)) {
		apiError = new Error('Faltan credenciales de la Creators API. Se retiran todas las ofertas.');
	} else if (withAsin.length > 0) {
		try {
			const asins = withAsin.map(p => p.asin.trim());
			for (let i = 0; i < asins.length; i += BATCH_SIZE) {
				const batch = await fetchAmazonItems(asins.slice(i, i + BATCH_SIZE), config);
				results = new Map([...results, ...batch]);
				if (i + BATCH_SIZE < asins.length) await sleep(PAUSE_MS);
			}
		} catch (error) {
			apiError = error;
		}
	}

	if (apiError) {
		log(`ERROR API: ${apiError.message}`);
	}

	let updated = 0;
	let retired = 0;
	const next = products.map(product => {
		const item = product.asin ? results.get(product.asin.trim()) : undefined;
		const valid =
			!apiError &&
			item &&
			typeof item.price === 'number' &&
			item.price > 0 &&
			isAmazonUrl(item.affiliateUrl);

		if (!valid) {
			if (product.price !== null || product.affiliateUrl) retired += 1;
			return retireOffer(product);
		}

		updated += 1;
		return {
			...product,
			price: item.price,
			currency: item.currency || product.currency || 'EUR',
			previousPrice: typeof item.previousPrice === 'number' && item.previousPrice > item.price ? item.previousPrice : null,
			affiliateUrl: item.affiliateUrl,
			priceCheckedAt: now,
		};
	});

	log(`Ofertas actualizadas: ${updated}. Ofertas retiradas: ${retired}.`);

	if (DRY_RUN) {
		log('Modo --dry-run: no se escribe el archivo.');
	} else {
		await writeFile(PRODUCTS_FILE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
		log(`Escrito ${PRODUCTS_FILE}`);
	}

	// Un fallo de API debe verse en el registro y en la ejecución (GitHub avisa por correo).
	// Sin credenciales se considera configuración pendiente y no falla el despliegue.
	if (apiError && hasCredentials(config)) {
		process.exitCode = 1;
	}
}

main().catch(error => {
	log(`ERROR: ${error.message}`);
	process.exitCode = 1;
});
