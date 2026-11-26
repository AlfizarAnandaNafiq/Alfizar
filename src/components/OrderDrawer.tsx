import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  formatRupiah,
  GROUP_DISCOUNT_MIN_QTY,
  GROUP_DISCOUNT_RATE,
  type OrderItem,
} from '../data/menuData';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  onQuickAddGroupPack: () => void;
}

export function OrderDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onQuickAddGroupPack,
}: OrderDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [orderRecorded, setOrderRecorded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setOrderRecorded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const qualifiesGroupDiscount = totalCount >= GROUP_DISCOUNT_MIN_QTY;
  const discountAmount = qualifiesGroupDiscount
    ? Math.round(subtotal * GROUP_DISCOUNT_RATE)
    : 0;
  const total = subtotal - discountAmount;
  const remainingForDiscount = Math.max(0, GROUP_DISCOUNT_MIN_QTY - totalCount);

  const waMessage = buildWhatsAppMessage(items, customerName, deliveryNote);
  const waUrl = buildWhatsAppUrl(waMessage);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-surface text-on-surface h-full flex flex-col border-l border-outline-variant shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-papaya-orange" aria-hidden="true" />
            <h2
              id="order-drawer-title"
              className="font-headline text-xl font-semibold text-on-surface"
            >
              Pesanan FreshBite
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup keranjang pesanan"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Promo Paket Hemat Progress */}
          <div className="rounded-xl bg-mango-soft border border-outline-variant p-4">
            {qualifiesGroupDiscount ? (
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="text-sm text-on-mango-soft">
                  <p className="font-bold">Promo Paket Hemat Aktif (Diskon 10%)</p>
                  <p className="text-on-surface-muted mt-0.5">
                    Hemat {formatRupiah(discountAmount)} untuk {totalCount} cup pilihanmu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-on-surface">
                    {totalCount === 0
                      ? 'Minimal 5 cup dapat Diskon Grup 10%'
                      : `Tambah ${remainingForDiscount} cup lagi untuk Diskon Grup 10%`}
                  </span>
                  <span className="font-bold tabular-nums text-papaya-deep">
                    {totalCount}/{GROUP_DISCOUNT_MIN_QTY}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-outline-variant">
                  <div
                    className="h-full bg-papaya-orange transition-all duration-150"
                    style={{
                      width: `${Math.min(100, (totalCount / GROUP_DISCOUNT_MIN_QTY) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center text-on-surface-muted">
                <ShoppingBag className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 max-w-xs">
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Keranjang masih kosong
                </p>
                <p className="text-sm text-on-surface-muted">
                  Pilih menu salad buah, jus segar, atau racik salad sendiri terlebih dahulu.
                </p>
              </div>
              <button
                type="button"
                onClick={onQuickAddGroupPack}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-5 py-2.5 text-sm font-bold hover:bg-papaya-orange hover:text-on-papaya-orange transition-colors duration-150"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Isi Paket Hemat (5 Regular)</span>
              </button>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-3" aria-label="Daftar menu dipesan">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-xl bg-surface-container-low border border-outline-variant p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-title font-bold text-base text-on-surface">
                          {item.name}
                        </h3>
                        {item.detail && (
                          <p className="text-xs text-on-surface-muted mt-0.5">
                            {item.detail}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-on-surface-muted tabular-nums mt-1">
                          {formatRupiah(item.price)} / cup
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        aria-label={`Hapus ${item.name}`}
                        className="p-2 rounded-lg text-on-surface-muted hover:text-error hover:bg-surface transition-colors duration-150"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                      <div className="inline-flex items-center gap-1 rounded-full bg-surface border border-outline-variant p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.key, -1)}
                          aria-label={`Kurangi jumlah ${item.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors duration-150"
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.key, 1)}
                          aria-label={`Tambah jumlah ${item.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors duration-150"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="font-title font-bold text-base text-on-surface tabular-nums">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Customer Details */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="order-customer-name"
                    className="text-xs font-bold uppercase tracking-wider text-on-surface-muted"
                  >
                    Nama Pemesan (Opsional)
                  </label>
                  <input
                    id="order-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Dina — Fakultas Ekonomi"
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="order-delivery-note"
                    className="text-xs font-bold uppercase tracking-wider text-on-surface-muted"
                  >
                    Alamat / Catatan Pengiriman (Opsional)
                  </label>
                  <input
                    id="order-delivery-note"
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Contoh: Antar jam 12.00 ke Lobby Gedung A"
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {orderRecorded && (
                <div
                  role="status"
                  className="rounded-xl bg-primary-container text-on-primary-container border border-outline-variant p-4 text-sm"
                >
                  <p className="font-bold">Ringkasan pesanan siap dikirim!</p>
                  <p className="mt-1">
                    Klik tombol WhatsApp di bawah atau salin pesan untuk langsung chat admin FreshBite.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Totals & Actions */}
        {items.length > 0 && (
          <div className="border-t border-outline-variant bg-surface-container-low px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between text-on-surface-muted">
                <span>Subtotal ({totalCount} cup)</span>
                <span className="tabular-nums font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              {qualifiesGroupDiscount && (
                <div className="flex items-center justify-between text-success font-semibold">
                  <span>Diskon Paket Hemat (10%)</span>
                  <span className="tabular-nums">-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-bold text-on-surface pt-2 border-t border-outline-variant">
                <span>Total Estimasi</span>
                <span className="text-lg tabular-nums">{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOrderRecorded(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-papaya-orange text-on-papaya-orange px-6 py-3.5 font-label text-sm font-bold transition-colors duration-150 hover:bg-papaya-deep hover:text-on-papaya-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Kirim Pesanan via WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-transparent text-primary px-4 py-2.5 text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors duration-150"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copied ? 'Teks Disalin!' : 'Salin Format Order'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-xs font-bold text-on-surface-muted hover:text-error hover:border-error transition-colors duration-150"
                >
                  Kosongkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
