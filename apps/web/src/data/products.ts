/**
 * Tipos y utilidades para el catálogo de PrecioFlash.
 *
 * Los productos viven en `products.json`, que genera el bot de precios con la
 * API de Amazon. El sitio es estático: no hay base de datos ni panel de edición.
 */

type ProductStatus = 'published' | 'draft';

export type Product = {
	id: string;
	/** Identificador de producto de Amazon (ASIN). Sin ASIN el bot no consulta precio. */
	asin?: string;
	name: string;
	brand: string;
	category: string;
	model: string;
	image: string;
	description: string;
	specs: Record<string, string>;
	/** Precio devuelto por la API en la última consulta. `null` si no hay dato fiable. */
	price: number | null;
	/** Fecha ISO de la consulta que dio `price`. Obligatoria si hay precio. */
	priceCheckedAt: string | null;
	currency: string;
	store: string;
	/** Enlace normal del producto (búsqueda o ficha en Amazon). */
	productUrl: string;
	/** Enlace de afiliado devuelto por la API con la etiqueta del asociado. */
	affiliateUrl: string;
	/** Precio anterior, solo si la API lo entrega. Nunca se inventa. */
	previousPrice: number | null;
	featured: boolean;
	popular: boolean;
	status: ProductStatus;
	/** Fecha ISO en la que se añadió al catálogo (para ordenar por novedades). */
	added?: string;
};

/** Un precio se muestra solo si se consultó hace menos de 24 horas. */
const PRICE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Atributo rel obligatorio en todo enlace de afiliado. */
export const AFFILIATE_REL = 'noopener noreferrer sponsored nofollow';

/** Solo se aceptan enlaces HTTPS a dominios de Amazon. */
const isAmazonUrl = (raw: string | undefined): boolean => {
	if (!raw) return false;
	try {
		const url = new URL(raw.trim());
		return url.protocol === 'https:' && /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname);
	} catch {
		return false;
	}
};

/** Un producto solo se presenta como enlace monetizado si tiene afiliado válido. */
export const hasAffiliate = (p: { affiliateUrl?: string }): boolean => isAmazonUrl(p.affiliateUrl);

/**
 * URL de salida: el enlace de afiliado si es de Amazon; si no, el enlace normal
 * si también es de Amazon. Cadena vacía si ninguno sirve.
 */
export const outboundUrl = (p: { affiliateUrl?: string; productUrl?: string }): string => {
	if (hasAffiliate(p)) return (p.affiliateUrl as string).trim();
	if (isAmazonUrl(p.productUrl)) return (p.productUrl as string).trim();
	return '';
};

/**
 * Precio mostrable: solo si existe, es positivo y fue consultado hace menos de
 * 24 horas. Si no, devuelve `null` y la interfaz pide consultar en Amazon.
 */
export const currentPrice = (p: Pick<Product, 'price' | 'priceCheckedAt'>, now = Date.now()): number | null => {
	if (p.price == null || p.price <= 0 || !p.priceCheckedAt) return null;
	const checked = Date.parse(p.priceCheckedAt);
	if (Number.isNaN(checked) || now - checked > PRICE_MAX_AGE_MS) return null;
	return p.price;
};

/** Formatea un precio verificable; devuelve `null` cuando no hay dato fiable. */
export const formatPrice = (price: number | null | undefined, currency = 'EUR'): string | null => {
	if (price == null || price <= 0) return null;

	try {
		return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(price);
	} catch {
		return `${price} ${currency}`;
	}
};

/**
 * Une el catálogo manual (products.json) con las ofertas que genera el bot
 * (offers.generated.json). El bot solo aporta datos de precio, enlace e imagen;
 * los productos que aporta y no están en el catálogo se añaden al final.
 */
type OfferEntry = Partial<Product> & { id: string };

export const mergeWithOffers = (manual: Product[], generated: OfferEntry[]): Product[] => {
	const byId = new Map(generated.map(g => [g.id, g]));
	const merged = manual.map(p => {
		const offer = byId.get(p.id);
		if (!offer) return p;
		byId.delete(p.id);
		return {
			...p,
			price: offer.price ?? null,
			priceCheckedAt: offer.priceCheckedAt ?? null,
			previousPrice: offer.previousPrice ?? null,
			affiliateUrl: offer.affiliateUrl ?? p.affiliateUrl,
			image: offer.image || p.image,
		};
	});
	return [...merged, ...([...byId.values()] as Product[])];
};

/** Fecha y hora legibles de la última consulta de precio. */
export const formatCheckedAt = (iso: string | null | undefined): string | null => {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};
