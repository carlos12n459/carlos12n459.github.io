import {
	Box,
	CircuitBoard,
	Computer,
	Cpu,
	Fan,
	HardDrive,
	Headphones,
	Keyboard,
	Laptop,
	MemoryStick,
	Monitor,
	Plug,
	Tv,
	type LucideIcon,
} from 'lucide-react';

export type SpecField = { key: string; label: string };

export type Category = {
	id: string;
	name: string;
	icon: LucideIcon;
	short: string;
	specs: SpecField[];
};

export const CATEGORIES: Category[] = [
	{
		id: 'gpu',
		name: 'Tarjetas gráficas',
		icon: Monitor,
		short: 'GPU',
		specs: [
			{ key: 'vram', label: 'Memoria VRAM' },
			{ key: 'fabricante', label: 'Fabricante' },
			{ key: 'interfaz', label: 'Interfaz' },
			{ key: 'consumo', label: 'Consumo (W)' },
		],
	},
	{
		id: 'cpu',
		name: 'Procesadores',
		icon: Cpu,
		short: 'CPU',
		specs: [
			{ key: 'socket', label: 'Socket' },
			{ key: 'nucleos', label: 'Núcleos' },
			{ key: 'hilos', label: 'Hilos' },
			{ key: 'generacion', label: 'Generación' },
		],
	},
	{
		id: 'desktop',
		name: 'PC gaming',
		icon: Computer,
		short: 'PC',
		specs: [
			{ key: 'cpu', label: 'Procesador' },
			{ key: 'gpu', label: 'Gráfica' },
			{ key: 'ram', label: 'RAM' },
			{ key: 'almacenamiento', label: 'Almacenamiento' },
		],
	},
	{
		id: 'laptop',
		name: 'Portátiles gaming',
		icon: Laptop,
		short: 'Portátil',
		specs: [
			{ key: 'cpu', label: 'Procesador' },
			{ key: 'gpu', label: 'Gráfica' },
			{ key: 'ram', label: 'RAM' },
			{ key: 'pantalla', label: 'Pantalla' },
		],
	},
	{
		id: 'monitor',
		name: 'Monitores',
		icon: Tv,
		short: 'Monitor',
		specs: [
			{ key: 'resolucion', label: 'Resolución' },
			{ key: 'tamano', label: 'Tamaño' },
			{ key: 'frecuencia', label: 'Frecuencia (Hz)' },
			{ key: 'panel', label: 'Tipo de panel' },
		],
	},
	{
		id: 'ram',
		name: 'Memorias RAM',
		icon: MemoryStick,
		short: 'RAM',
		specs: [
			{ key: 'capacidad', label: 'Capacidad' },
			{ key: 'ddr', label: 'Generación DDR' },
			{ key: 'velocidad', label: 'Velocidad (MHz)' },
			{ key: 'formato', label: 'Formato' },
		],
	},
	{
		id: 'storage',
		name: 'SSD y HDD',
		icon: HardDrive,
		short: 'Almacenamiento',
		specs: [
			{ key: 'capacidad', label: 'Capacidad' },
			{ key: 'tipo', label: 'Tipo de unidad' },
			{ key: 'interfaz', label: 'Interfaz' },
			{ key: 'lectura', label: 'Lectura (MB/s)' },
		],
	},
	{
		id: 'motherboard',
		name: 'Placas base',
		icon: CircuitBoard,
		short: 'Placa base',
		specs: [
			{ key: 'socket', label: 'Socket' },
			{ key: 'chipset', label: 'Chipset' },
			{ key: 'formato', label: 'Formato' },
			{ key: 'ramSlots', label: 'Ranuras RAM' },
		],
	},
	{
		id: 'psu',
		name: 'Fuentes de alimentación',
		icon: Plug,
		short: 'Fuente',
		specs: [
			{ key: 'potencia', label: 'Potencia (W)' },
			{ key: 'certificacion', label: 'Certificación' },
			{ key: 'modular', label: 'Modular' },
			{ key: 'eficiencia', label: 'Eficiencia' },
		],
	},
	{
		id: 'cooling',
		name: 'Refrigeración',
		icon: Fan,
		short: 'Refrigeración',
		specs: [
			{ key: 'tipo', label: 'Tipo' },
			{ key: 'compatibilidad', label: 'Sockets compatibles' },
			{ key: 'rpm', label: 'RPM' },
			{ key: 'ruido', label: 'Ruido (dB)' },
		],
	},
	{
		id: 'case',
		name: 'Gabinetes',
		icon: Box,
		short: 'Gabinete',
		specs: [
			{ key: 'formato', label: 'Formato' },
			{ key: 'ventiladores', label: 'Ventiladores incluidos' },
			{ key: 'panel', label: 'Panel lateral' },
			{ key: 'rgb', label: 'RGB' },
		],
	},
	{
		id: 'peripherals',
		name: 'Periféricos gaming',
		icon: Keyboard,
		short: 'Periféricos',
		specs: [
			{ key: 'tipo', label: 'Tipo' },
			{ key: 'conectividad', label: 'Conectividad' },
			{ key: 'switches', label: 'Switches' },
			{ key: 'rgb', label: 'RGB' },
		],
	},
	{
		id: 'audio',
		name: 'Auriculares y audio',
		icon: Headphones,
		short: 'Audio',
		specs: [
			{ key: 'tipo', label: 'Tipo' },
			{ key: 'conectividad', label: 'Conectividad' },
			{ key: 'microfono', label: 'Micrófono' },
			{ key: 'surround', label: 'Surround' },
		],
	},
];

export const categoryName = (id: string): string =>
	CATEGORIES.find(c => c.id === id)?.name ?? id;

export const categorySpecs = (id: string): SpecField[] =>
	CATEGORIES.find(c => c.id === id)?.specs ?? [];

export const categoryById = (id: string): Category | undefined =>
	CATEGORIES.find(c => c.id === id);
