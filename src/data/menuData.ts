export type MenuCategory = 'all' | 'salad' | 'minuman';

export interface MenuItem {
  id: string;
  name: string;
  category: Exclude<MenuCategory, 'all'>;
  price: number;
  description: string;
  image: string;
  alt: string;
  badge?: string;
  badgeVariant?: 'mango' | 'primary';
  featuredLayout?: boolean;
  colSpanClass: string;
  cardBgClass: string;
  imageAspectClass: string;
  buttonHighlight?: boolean;
}

export interface CustomSizeOption {
  id: string;
  label: string;
  displayValue: string;
  price: number;
}

export interface OrderItem {
  key: string;
  name: string;
  price: number;
  quantity: number;
  detail?: string;
}

export const WHATSAPP_NUMBER = '6281234567890';
export const GROUP_DISCOUNT_MIN_QTY = 5;
export const GROUP_DISCOUNT_RATE = 0.1;

export const HERO_IMAGE = '/src/assets/images/hero_fruit_salad_1795655914537.jpg';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'salad-regular',
    name: 'Salad Buah Regular',
    category: 'salad',
    price: 15000,
    description:
      'Best Seller · Kombinasi melon, semangka, apel, anggur, mangga, stroberi.',
    image: '/src/assets/images/menu_salad_regular_1795655914501.jpg',
    alt: 'Salad Buah Regular FreshBite dengan potongan buah segar dan keju parut',
    badge: 'Best Seller',
    badgeVariant: 'mango',
    featuredLayout: true,
    colSpanClass: 'md:col-span-7',
    cardBgClass: 'bg-mango-soft',
    imageAspectClass: 'md:w-1/2 min-h-56',
    buttonHighlight: true,
  },
  {
    id: 'salad-mini',
    name: 'Salad Buah Mini',
    category: 'salad',
    price: 10000,
    description: 'Porsi pas untuk camilan cepat di kampus atau kantor.',
    image: '/src/assets/images/menu_salad_mini_1795655916104.jpg',
    alt: 'Salad Buah Mini FreshBite kemasan praktis',
    featuredLayout: false,
    colSpanClass: 'md:col-span-5',
    cardBgClass: 'bg-surface-container-low',
    imageAspectClass: 'aspect-[4/3]',
  },
  {
    id: 'salad-jumbo',
    name: 'Salad Buah Jumbo',
    category: 'salad',
    price: 25000,
    description: 'Porsi puas untuk sharing atau pengganti makan siang.',
    image: '/src/assets/images/menu_salad_jumbo_1795655916506.jpg',
    alt: 'Salad Buah Jumbo FreshBite porsi besar untuk berbagi',
    featuredLayout: false,
    colSpanClass: 'md:col-span-5',
    cardBgClass: 'bg-surface-container-low',
    imageAspectClass: 'aspect-[4/3]',
  },
  {
    id: 'fruit-granola',
    name: 'Fruit Bowl Granola',
    category: 'salad',
    price: 18000,
    description: 'Dengan topping granola renyah dan madu murni.',
    image: '/src/assets/images/menu_fruit_granola_1795655916989.jpg',
    alt: 'Fruit Bowl Granola FreshBite dengan madu murni',
    badge: 'Favorit Sarapan',
    badgeVariant: 'primary',
    featuredLayout: true,
    colSpanClass: 'md:col-span-7',
    cardBgClass: 'bg-surface-container-low',
    imageAspectClass: 'md:w-1/2 min-h-56',
  },
  {
    id: 'jus-buah',
    name: 'Jus Buah Segar',
    category: 'minuman',
    price: 8000,
    description: '100% sari buah murni tanpa pemanis buatan.',
    image: '/src/assets/images/menu_jus_buah_1795655917823.jpg',
    alt: 'Jus Buah Segar FreshBite dalam botol kaca dingin',
    featuredLayout: true,
    colSpanClass: 'md:col-span-6',
    cardBgClass: 'bg-surface-container-low',
    imageAspectClass: 'md:w-2/5 min-h-48',
  },
  {
    id: 'yogurt-buah',
    name: 'Yogurt Buah',
    category: 'minuman',
    price: 12000,
    description: 'Potongan buah segar dengan creamy yogurt rendah lemak.',
    image: '/src/assets/images/menu_yogurt_buah_1795655917882.jpg',
    alt: 'Yogurt Buah FreshBite dengan lapisan buah tropis',
    featuredLayout: true,
    colSpanClass: 'md:col-span-6',
    cardBgClass: 'bg-surface-container-low',
    imageAspectClass: 'md:w-2/5 min-h-48',
  },
];

export const CUSTOM_SIZES: CustomSizeOption[] = [
  { id: 'mini', label: 'Mini', displayValue: 'Mini (Rp10.000)', price: 10000 },
  { id: 'regular', label: 'Regular', displayValue: 'Regular (Rp15.000)', price: 15000 },
  { id: 'jumbo', label: 'Jumbo', displayValue: 'Jumbo (Rp25.000)', price: 25000 },
];

export const CUSTOM_SAUCES: string[] = ['Creamy Yogurt', 'Classic Mayo'];

export const CUSTOM_TOPPINGS: string[] = ['Granola', 'Madu', 'Keju'];

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export function buildWhatsAppMessage(
  items: OrderItem[],
  customerName?: string,
  deliveryNote?: string,
): string {
  if (items.length === 0) {
    return 'Halo FreshBite! Saya mau pesan menu segar hari ini.';
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasGroupDiscount = totalCount >= GROUP_DISCOUNT_MIN_QTY;
  const discountAmount = hasGroupDiscount ? Math.round(subtotal * GROUP_DISCOUNT_RATE) : 0;
  const finalTotal = subtotal - discountAmount;

  const lines = [
    'Halo FreshBite! Saya mau pesan menu segar hari ini:',
    '',
    ...items.map((item, idx) => {
      const detailText = item.detail ? ` (${item.detail})` : '';
      return `${idx + 1}. ${item.name}${detailText} x${item.quantity} — ${formatRupiah(item.price * item.quantity)}`;
    }),
    '',
    `Subtotal (${totalCount} item): ${formatRupiah(subtotal)}`,
  ];

  if (hasGroupDiscount) {
    lines.push(`Diskon Paket Hemat (10%): -${formatRupiah(discountAmount)}`);
  }

  lines.push(`Total Bayar: ${formatRupiah(finalTotal)}`);

  if (customerName?.trim()) {
    lines.push(`Nama: ${customerName.trim()}`);
  }
  if (deliveryNote?.trim()) {
    lines.push(`Catatan/Alamat: ${deliveryNote.trim()}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
