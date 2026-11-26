import { useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Droplets,
  Leaf,
  MessageCircle,
  Package,
  PartyPopper,
  Plus,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wallet,
} from 'lucide-react';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  CUSTOM_SAUCES,
  CUSTOM_SIZES,
  CUSTOM_TOPPINGS,
  formatRupiah,
  HERO_IMAGE,
  MENU_ITEMS,
  type MenuCategory,
  type OrderItem,
} from './data/menuData';
import { ResilientImage } from './components/ResilientImage';
import { OrderDrawer } from './components/OrderDrawer';
import { ChatBotWidget } from './components/ChatBotWidget';

const CATEGORY_TABS: { id: MenuCategory; label: string }[] = [
  { id: 'all', label: 'Semua Menu' },
  { id: 'salad', label: 'Salad Buah' },
  { id: 'minuman', label: 'Jus & Yogurt' },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('all');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('mini');
  const [selectedSauce, setSelectedSauce] = useState<string>('Creamy Yogurt');
  const [selectedTopping, setSelectedTopping] = useState<string>('Granola');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const selectedSize =
    CUSTOM_SIZES.find((s) => s.id === selectedSizeId) || CUSTOM_SIZES[0];

  const totalCartCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredMenu = MENU_ITEMS.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory,
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addOrderItem = (newItem: Omit<OrderItem, 'quantity'>, qty = 1) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.key === newItem.key);
      if (existing) {
        return prev.map((item) =>
          item.key === newItem.key
            ? { ...item, quantity: item.quantity + qty }
            : item,
        );
      }
      return [...prev, { ...newItem, quantity: qty }];
    });
  };

  const handleAddMenu = (name: string, price: number, id: string) => {
    addOrderItem({ key: `menu:${id}`, name, price });
    showToast(`${name} (${formatRupiah(price)}) siap dipesan via WhatsApp`);
  };

  const handleAddCustomSalad = () => {
    const detail = `${selectedSize.label}, ${selectedSauce}, Topping ${selectedTopping}`;
    const key = `custom:${selectedSize.id}:${selectedSauce}:${selectedTopping}`;
    addOrderItem({
      key,
      name: `Custom Salad ${selectedSize.label}`,
      price: selectedSize.price,
      detail,
    });
    showToast(
      `Custom Salad ${selectedSize.label} (${formatRupiah(selectedSize.price)}) ditambahkan`,
    );
    setIsDrawerOpen(true);
  };

  const handleAddGroupPack = () => {
    addOrderItem(
      {
        key: 'menu:salad-regular',
        name: 'Salad Buah Regular',
        price: 15000,
      },
      5,
    );
    showToast('5x Salad Buah Regular ditambahkan (Diskon Grup 10% aktif!)');
    setIsDrawerOpen(true);
  };

  const handleUpdateQuantity = (key: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveItem = (key: string) => {
    setOrderItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleClearCart = () => {
    setOrderItems([]);
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = CATEGORY_TABS[(index + 1) % CATEGORY_TABS.length];
      setActiveCategory(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev =
        CATEGORY_TABS[(index - 1 + CATEGORY_TABS.length) % CATEGORY_TABS.length];
      setActiveCategory(prev.id);
    }
  };

  const handleSocialClick = async (handle: string) => {
    try {
      await navigator.clipboard.writeText(handle);
      showToast(`Username ${handle} disalin ke clipboard`);
    } catch {
      showToast(`Ikuti kami di ${handle}`);
    }
  };

  const footerWaUrl = buildWhatsAppUrl(buildWhatsAppMessage(orderItems));

  return (
    <div className="min-h-screen flex flex-col paper-grain bg-surface text-on-surface">
      {/* 1. Sticky Top Navigation (3-Zone Top Bar Contract) */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#"
            className="font-display text-2xl font-semibold text-on-surface tracking-tight whitespace-nowrap shrink-0"
          >
            FreshBite<span className="text-papaya-orange">.</span>
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-8"
          >
            <a
              href="#menu"
              className="font-label text-sm font-bold text-on-surface-muted hover:text-on-surface hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Menu
            </a>
            <a
              href="#kenapa"
              className="font-label text-sm font-bold text-on-surface-muted hover:text-on-surface hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Kenapa FreshBite
            </a>
            <a
              href="#paket-hemat"
              className="font-label text-sm font-bold text-on-surface-muted hover:text-on-surface hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Paket Hemat
            </a>
            <a
              href="#racik"
              className="font-label text-sm font-bold text-on-surface-muted hover:text-on-surface hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Cara Pesan
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-papaya-orange text-on-papaya-orange px-5 py-2.5 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-papaya-deep hover:text-on-papaya-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {totalCartCount > 0 ? (
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              ) : (
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="tabular-nums">
                {totalCartCount > 0
                  ? `Pesanan (${totalCartCount})`
                  : 'Pesan via WhatsApp'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section (Asymmetrical Split Layout) */}
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-muted">
                100% Buah Segar Harian · Tanpa Pemanis Buatan
              </p>

              <h1 className="font-display text-[34px] leading-[40px] sm:text-5xl sm:leading-[54px] lg:text-[64px] lg:leading-[68px] font-bold tracking-[-0.02em] text-on-surface text-balance max-w-2xl">
                Fresh Every Day, Healthy Every Bite!
              </h1>

              <p className="font-body text-lg leading-7 text-on-surface-muted max-w-prose text-pretty">
                Solusi ngemil sehat, praktis, dan ramah di kantong pelajar hingga
                pekerja sibuk. Dibuat fresh setiap pagi dengan buah pilihan.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#menu"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-papaya-orange text-on-papaya-orange px-7 py-3.5 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-papaya-deep hover:text-on-papaya-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Lihat Menu &amp; Harga</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>

                <a
                  href="#racik"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-transparent text-primary px-7 py-3.5 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Custom Salad Sendiri</span>
                </a>
              </div>
            </div>

            {/* Right Column (5 cols): Arch-framed hero image + floating stickers */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="overflow-hidden rounded-t-full rounded-b-[28px] border border-outline-variant bg-surface-container-low p-2.5">
                  <ResilientImage
                    src={HERO_IMAGE}
                    alt="Cup salad buah segar berlapis dengan saus yogurt creamy dari FreshBite"
                    fallbackTitle="FreshBite Fruit Salad"
                    className="w-full aspect-[3/4] object-cover rounded-t-full rounded-b-[20px]"
                  />
                </div>

                {/* Floating Sticker 1: Mulai Rp8.000 */}
                <div className="absolute top-12 -left-2 sm:-left-6 rounded-full bg-mango-yellow text-on-mango-yellow px-5 py-2.5 shadow-md border border-outline-variant">
                  <span className="font-title text-base font-bold tabular-nums block whitespace-nowrap">
                    Mulai Rp8.000
                  </span>
                </div>

                {/* Floating Sticker 2: Higienis & Praktis */}
                <div className="absolute bottom-8 -right-2 sm:-right-5 rounded-full bg-primary text-on-primary px-5 py-2.5 shadow-md flex items-center gap-2">
                  <BadgeCheck
                    className="w-4 h-4 text-mango-yellow shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-label text-sm font-bold whitespace-nowrap">
                    Higienis &amp; Praktis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive Menu Showcase (Bento Card Grid with Category Tabs) */}
        <section
          id="menu"
          className="max-w-7xl mx-auto px-6 py-16 border-t border-outline-variant"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-[30px] leading-[36px] md:text-[48px] md:leading-[54px] font-bold tracking-[-0.02em] text-on-surface text-balance">
                Menu Segar Hari Ini
              </h2>
              <p className="font-body text-[15px] leading-6 text-on-surface-muted max-w-prose">
                Dipetik dan diracik setiap pagi. Pilih ukuran pas untuk camilan,
                makan siang, atau stok sehat di kulkasmu.
              </p>
            </div>

            {/* Horizontal Category Tabs */}
            <div>
              <div
                role="tablist"
                aria-label="Kategori Menu FreshBite"
                className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-surface-container-low border border-outline-variant p-1.5"
              >
                {CATEGORY_TABS.map((tab, idx) => {
                  const isSelected = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setActiveCategory(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(e, idx)}
                      className={`rounded-full px-5 py-2 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'bg-transparent text-on-surface-muted hover:text-on-surface'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Asymmetrical Bento Menu Grid (12 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {filteredMenu.map((item) => {
              const inCartItem = orderItems.find((o) => o.key === `menu:${item.id}`);
              const isHorizontalCard = item.featuredLayout;

              return (
                <article
                  key={item.id}
                  className={`${item.colSpanClass} rounded-[24px] ${item.cardBgClass} border border-outline-variant p-6 flex flex-col ${
                    isHorizontalCard ? 'md:flex-row gap-6' : 'justify-between gap-4'
                  } items-stretch transition-transform duration-150 hover:-translate-y-0.5`}
                >
                  <div
                    className={`overflow-hidden rounded-[16px] bg-surface-container ${item.imageAspectClass}`}
                  >
                    <ResilientImage
                      src={item.image}
                      alt={item.alt}
                      fallbackTitle={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div
                    className={`${
                      isHorizontalCard
                        ? item.id === 'jus-buah' || item.id === 'yogurt-buah'
                          ? 'md:w-3/5'
                          : 'md:w-1/2'
                        : 'flex-1'
                    } flex flex-col justify-between gap-4`}
                  >
                    <div className="flex flex-col items-start gap-2">
                      {item.badge && (
                        <span className="font-label text-xs font-bold uppercase tracking-wider text-papaya-deep">
                          {item.badge}
                        </span>
                      )}
                      <h3 className="font-headline text-2xl font-semibold text-on-surface">
                        {item.name}
                      </h3>
                      <p className="font-body text-[15px] leading-6 text-on-surface-muted">
                        {item.description}
                      </p>
                    </div>

                    <footer className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant">
                      <span className="font-title text-xl font-bold text-on-surface tabular-nums">
                        {formatRupiah(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddMenu(item.name, item.price, item.id)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          item.buttonHighlight
                            ? 'bg-papaya-orange text-on-papaya-orange hover:bg-papaya-deep hover:text-on-papaya-deep'
                            : 'bg-primary text-on-primary hover:bg-papaya-orange hover:text-on-papaya-orange'
                        }`}
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span className="tabular-nums">
                          {inCartItem ? `Pesan (${inCartItem.quantity})` : 'Pesan'}
                        </span>
                      </button>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 4. "Build Your Own" Customization Highlight */}
        <section
          id="racik"
          className="bg-surface-container-low border-y border-outline-variant py-16"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="flex flex-col gap-1">
                <span className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-muted">
                  Custom Order · Cara Pesan
                </span>
                <h2 className="font-display text-[30px] leading-[36px] md:text-[48px] md:leading-[54px] font-bold tracking-[-0.02em] text-on-surface text-balance">
                  Racik Sesuai Seleramu
                </h2>
              </div>
              <p className="font-body text-[15px] leading-6 text-on-surface-muted max-w-md">
                Pilih ukuran cup, saus favorit, dan ekstra topping dalam 3 langkah
                mudah sebelum kirim pesanan ke WhatsApp kami.
              </p>
            </div>

            {/* Horizontal 3-Step Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Step 1: Pilih Ukuran Cup */}
              <div className="rounded-[24px] bg-surface border border-outline-variant p-6 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs font-bold uppercase tracking-wider text-papaya-deep">
                    Langkah 01
                  </span>
                  <Utensils
                    className="w-5 h-5 text-on-surface-muted"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-headline text-2xl font-semibold text-on-surface">
                    Pilih Ukuran Cup
                  </h3>
                  <p className="font-body text-[15px] text-on-surface-muted">
                    Sesuaikan porsi ngemil atau makan siangmu.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {CUSTOM_SIZES.map((size) => {
                    const active = selectedSizeId === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setSelectedSizeId(size.id)}
                        className={`rounded-full border px-4 py-2 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary'
                        }`}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Pilih Saus */}
              <div className="rounded-[24px] bg-surface border border-outline-variant p-6 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs font-bold uppercase tracking-wider text-papaya-deep">
                    Langkah 02
                  </span>
                  <Droplets
                    className="w-5 h-5 text-on-surface-muted"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-headline text-2xl font-semibold text-on-surface">
                    Pilih Saus
                  </h3>
                  <p className="font-body text-[15px] text-on-surface-muted">
                    Dibuat segar tanpa pemanis buatan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {CUSTOM_SAUCES.map((sauce) => {
                    const active = selectedSauce === sauce;
                    return (
                      <button
                        key={sauce}
                        type="button"
                        onClick={() => setSelectedSauce(sauce)}
                        className={`rounded-full border px-4 py-2 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary'
                        }`}
                      >
                        {sauce}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Tambah Topping */}
              <div className="rounded-[24px] bg-surface border border-outline-variant p-6 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs font-bold uppercase tracking-wider text-papaya-deep">
                    Langkah 03
                  </span>
                  <Sparkles
                    className="w-5 h-5 text-on-surface-muted"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-headline text-2xl font-semibold text-on-surface">
                    Tambah Topping
                  </h3>
                  <p className="font-body text-[15px] text-on-surface-muted">
                    Ekstra renyah atau manis alami.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {CUSTOM_TOPPINGS.map((topping) => {
                    const active = selectedTopping === topping;
                    return (
                      <button
                        key={topping}
                        type="button"
                        onClick={() => setSelectedTopping(topping)}
                        className={`rounded-full border px-4 py-2 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary'
                        }`}
                      >
                        {topping}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Custom Summary Strip */}
            <div className="mt-6 rounded-[24px] bg-primary text-on-primary p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-label text-xs font-bold uppercase tracking-wider text-mango-yellow">
                  Racikan Pilihanmu
                </span>
                <p className="font-title text-xl font-bold tabular-nums">
                  {selectedSize.displayValue} · {selectedSauce} · {selectedTopping}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomSalad}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-papaya-orange text-on-papaya-orange px-6 py-3 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-mango-yellow hover:text-on-mango-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango-yellow"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Pesan Racikan Ini</span>
              </button>
            </div>
          </div>
        </section>

        {/* 5. Value Proposition & Target Audience Bento Grid */}
        <section id="kenapa" className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="font-display text-[30px] leading-[36px] md:text-[48px] md:leading-[54px] font-bold tracking-[-0.02em] text-on-surface text-balance">
              Kenapa Memilih FreshBite?
            </h2>
            <p className="font-body text-[15px] leading-6 text-on-surface-muted max-w-prose">
              Dirancang khusus untuk gaya hidup aktif pelajar, mahasiswa, dan
              pekerja sibuk tanpa mengorbankan rasa maupun budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Bento 1 (7 cols) */}
            <article className="md:col-span-7 rounded-[24px] bg-primary text-on-primary p-8 flex flex-col justify-between gap-6">
              <div className="w-12 h-12 rounded-full bg-mango-yellow text-on-mango-yellow flex items-center justify-center">
                <Leaf className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-headline text-2xl font-semibold">
                  Dibuat Setiap Pagi
                </h3>
                <p className="font-body text-[15px] leading-6 text-primary-container max-w-prose">
                  Kesegaran terjamin. Semua buah dipilih dan dipotong setiap pagi
                  hari sehingga tekstur tetap renyah, manis alami, dan kaya
                  vitamin.
                </p>
              </div>
            </article>

            {/* Bento 2 (5 cols) */}
            <article className="md:col-span-5 rounded-[24px] bg-mango-soft text-on-mango-soft border border-outline-variant p-8 flex flex-col justify-between gap-6">
              <div className="w-12 h-12 rounded-full bg-papaya-orange text-on-papaya-orange flex items-center justify-center">
                <Wallet className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-headline text-2xl font-semibold text-on-surface">
                  Ramah di Kantong
                </h3>
                <p className="font-body text-[15px] leading-6 text-on-surface-muted">
                  Harga pelajar &amp; mahasiswa mulai 8 ribuan. Ngemil buah segar
                  setiap hari tidak perlu menunggu gajian.
                </p>
              </div>
            </article>

            {/* Bento 3 (5 cols) */}
            <article className="md:col-span-5 rounded-[24px] bg-surface-container-low border border-outline-variant p-8 flex flex-col justify-between gap-6">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                <Package className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-headline text-2xl font-semibold text-on-surface">
                  Kemasan Estetik &amp; Higienis
                </h3>
                <p className="font-body text-[15px] leading-6 text-on-surface-muted">
                  Cup food-grade anti tumpah lengkap dengan sendok. Mudah dibawa ke
                  sekolah, kampus, atau kantor.
                </p>
              </div>
            </article>

            {/* Bento 4 (7 cols): Paket Hemat */}
            <article
              id="paket-hemat"
              className="md:col-span-7 rounded-[24px] bg-surface-container border border-outline-variant p-8 flex flex-col justify-between gap-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center">
                  <PartyPopper className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="font-label text-xs font-bold uppercase tracking-wider text-papaya-deep">
                  Diskon Grup 10%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-headline text-2xl font-semibold text-on-surface">
                  Promo Paket Hemat
                </h3>
                <p className="font-body text-[15px] leading-6 text-on-surface-muted max-w-prose">
                  Diskon khusus pemesanan rame-rame untuk acara kelas, rapat
                  kantor, arisan, atau traktiran bareng teman. Minimal 5 cup sudah
                  dapat harga spesial.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddGroupPack}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-5 py-2.5 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-papaya-orange hover:text-on-papaya-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Pesan Paket Hemat (5 Regular)</span>
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* 6. Social Proof & Ordering Footer */}
      <footer
        id="pesan-whatsapp"
        className="bg-primary text-on-primary mt-8 pb-20"
      >
        <div className="max-w-7xl mx-auto px-6 pt-16 flex flex-col gap-12">
          {/* Bold Closing CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-12 border-b border-on-surface-muted">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <h2 className="font-display text-[30px] leading-[36px] md:text-[48px] md:leading-[54px] font-bold tracking-[-0.02em] text-on-primary text-balance">
                Siap Hidup Lebih Sehat Hari Ini?
              </h2>
              <p className="font-body text-lg leading-7 text-primary-container max-w-prose">
                Pesan sekarang sebelum stok buah segar pagi ini habis. Pengiriman
                cepat area kampus, perkantoran, dan perumahan.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              <a
                href={footerWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-papaya-orange text-on-papaya-orange px-8 py-4 font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-mango-yellow hover:text-on-mango-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango-yellow"
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                <span>Pesan via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Bottom Footer Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="flex flex-col gap-2">
              <span className="font-display text-2xl font-semibold text-on-primary">
                FreshBite<span className="text-mango-yellow">.</span>
              </span>
              <p className="font-body text-[15px] text-primary-container">
                Fresh Every Day, Healthy Every Bite!
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label text-xs font-bold uppercase tracking-wider text-mango-yellow">
                Jam Operasional
              </span>
              <p className="font-body text-[15px] text-on-primary flex items-center gap-2">
                <Clock
                  className="w-4 h-4 text-mango-yellow shrink-0"
                  aria-hidden="true"
                />
                <span>Senin – Minggu, 07.00 – 19.00 WIB</span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label text-xs font-bold uppercase tracking-wider text-mango-yellow">
                Ikuti Kami
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialClick('@freshbite.id')}
                  className="font-label text-sm font-bold text-on-primary hover:text-mango-yellow transition-colors duration-150"
                >
                  Instagram @freshbite.id
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialClick('@freshbite.healthy')}
                  className="font-label text-sm font-bold text-on-primary hover:text-mango-yellow transition-colors duration-150"
                >
                  TikTok @freshbite.healthy
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-5 z-40 rounded-full bg-primary text-on-primary border border-mango-yellow px-5 py-3 shadow-lg flex items-center gap-3 max-w-[calc(100vw-2.5rem)]"
        >
          <CheckCircle2
            className="w-4 h-4 text-mango-yellow shrink-0"
            aria-hidden="true"
          />
          <span className="font-label text-sm font-bold truncate">
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="font-label text-xs font-bold text-mango-yellow underline underline-offset-2 shrink-0 hover:text-on-primary"
          >
            Lihat
          </button>
        </div>
      )}

      {/* n8n Webhook Chatbot Widget */}
      <ChatBotWidget orderItems={orderItems} />

      {/* Interactive WhatsApp Order Drawer */}
      <OrderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={orderItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onQuickAddGroupPack={handleAddGroupPack}
      />
    </div>
  );
}
