/**
 * Cliente mínimo de la Creators API de Amazon (REST, sin SDK).
 * Documentación: affiliate-program.amazon.com/creatorsapi/docs
 *
 * Credenciales (variables de entorno, nunca en el código):
 *   CREATORS_CREDENTIAL_ID, CREATORS_CREDENTIAL_SECRET, CREATORS_VERSION (3.1 | 3.2 | 3.3),
 *   CREATORS_PARTNER_TAG, CREATORS_MARKETPLACE (por ejemplo www.amazon.es)
 */

const API_BASE = 'https://creatorsapi.amazon';

// Endpoint de token según la versión de credenciales (Login with Amazon).
const TOKEN_ENDPOINTS = {
	'3.1': 'https://api.amazon.com/auth/o2/token',
	'3.2': 'https://api.amazon.co.uk/auth/o2/token',
	'3.3': 'https://api.amazon.co.jp/auth/o2/token',
};

/** Pausa mínima entre peticiones para respetar el límite de solicitudes por segundo. */
const PAUSE_MS = 1100;
const MAX_RETRIES = 4;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let lastCallAt = 0;
async function throttle() {
	const wait = lastCallAt + PAUSE_MS - Date.now();
	if (wait > 0) await sleep(wait);
	lastCallAt = Date.now();
}

/** Reintenta con espera creciente ante 429 y errores 5xx. */
async function request(url, init) {
	for (let attempt = 0; ; attempt += 1) {
		await throttle();
		const res = await fetch(url, init);
		if (res.ok) return res.json();

		const retryable = res.status === 429 || res.status >= 500;
		if (!retryable || attempt >= MAX_RETRIES) {
			const body = (await res.text()).slice(0, 300);
			throw new Error(`Creators API ${res.status}: ${body}`);
		}
		await sleep(2 ** attempt * 1000);
	}
}

let tokenCache = null;

async function getAccessToken(config) {
	if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

	const endpoint = TOKEN_ENDPOINTS[config.version];
	if (!endpoint) throw new Error(`CREATORS_VERSION no válida: "${config.version}" (usa 3.1, 3.2 o 3.3)`);

	const json = await request(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'client_credentials',
			client_id: config.credentialId,
			client_secret: config.credentialSecret,
			scope: 'creatorsapi::default',
		}),
	});

	tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
	return tokenCache.token;
}

async function call(config, operation, body) {
	const token = await getAccessToken(config);
	return request(`${API_BASE}/catalog/v1/${operation}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'x-marketplace': config.marketplace,
		},
		body: JSON.stringify({ ...body, marketplace: config.marketplace, partnerTag: config.partnerTag }),
	});
}

/** Recursos que pedimos para precio, imagen y título. */
export const ITEM_RESOURCES = [
	'itemInfo.title',
	'itemInfo.byLineInfo',
	'images.primary.large',
	'offersV2.listings.price',
	'offersV2.listings.condition',
	'offersV2.listings.availability',
	'offersV2.listings.isBuyBoxWinner',
	'offersV2.listings.merchantInfo',
];

/** Hasta 10 ASIN por petición. Devuelve la lista de items encontrados. */
export async function getItems(config, asins) {
	const json = await call(config, 'getItems', {
		itemIds: asins,
		itemIdType: 'ASIN',
		condition: 'New',
		resources: ITEM_RESOURCES,
	});
	return json.itemsResult?.items ?? json.itemResults?.items ?? [];
}

/** Búsqueda por palabras clave. Hasta 10 resultados por petición. */
export async function searchItems(config, { keywords, searchIndex = 'All', itemCount = 10 }) {
	const json = await call(config, 'searchItems', {
		keywords,
		searchIndex,
		itemCount: Math.min(itemCount, 10),
		condition: 'New',
		resources: ITEM_RESOURCES,
	});
	return json.searchResult?.items ?? [];
}
