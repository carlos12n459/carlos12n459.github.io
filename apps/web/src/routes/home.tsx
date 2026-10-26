import { useState } from 'react';
import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { Hero } from '@/components/home/hero';
import { Catalog } from '@/components/home/catalog';
import { HowItWorks } from '@/components/home/how-it-works';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'PrecioFlash — Componentes de PC y gaming al mejor precio',
		description: 'Compara tarjetas gráficas, procesadores, PC gaming, monitores y periféricos. Enlaces a Amazon, sin registro ni compras en el sitio.',
		image: 'https://images.unsplash.com/photo-1682096101368-e97a285f9c72?w=1024&h=1024&fit=crop&q=80',
		jsonLd: [
			{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'PrecioFlash', description: 'Comparador de componentes de PC y productos gaming con enlaces de afiliado a Amazon.' },
			{ '@context': 'https://schema.org', '@type': 'Organization', name: 'PrecioFlash' },
		],
	});
}

export default function HomePage() {
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<string | null>(null);
	const reset = () => { setQuery(''); setCategory(null); };
	return (
		<main>
			<Hero query={query} setQuery={setQuery} />
			<Catalog query={query} category={category} setCategory={setCategory} reset={reset} />
			<HowItWorks />
		</main>
	);
}
