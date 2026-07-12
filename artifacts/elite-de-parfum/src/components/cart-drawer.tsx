import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, Ticket, Loader2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useCart } from "@/context/cart";
import { apiFetch } from "@/lib/api";
import { Link } from "wouter";

interface AppliedDiscount {
  code: string;
  discountAmount: number;
  total: number;
}

export function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const [agreed, setAgreed] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);

  // Reset agreement when cart closes
  useEffect(() => {
    if (!isOpen) setAgreed(false);
  }, [isOpen]);

  // Re-validate the applied code whenever the subtotal changes
  useEffect(() => {
    if (!discount) return;
    if (items.length === 0) { setDiscount(null); return; }
    apiFetch("/api/discounts/validate", {
      method: "POST",
      body: JSON.stringify({ code: discount.code, subtotal: totalPrice }),
    })
      .then(d => setDiscount({ code: d.code, discountAmount: d.discountAmount, total: d.total }))
      .catch(() => setDiscount(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice, items.length]);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const d = await apiFetch("/api/discounts/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal: totalPrice }),
      });
      setDiscount({ code: d.code, discountAmount: d.discountAmount, total: d.total });
      setPromoInput("");
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setPromoLoading(false);
    }
  };

  const finalTotal = discount ? discount.total : totalPrice;

  const buildWhatsAppMessage = () => {
    const lines = items.map(
      item => `• ${item.name} (${item.size}) x${item.quantity} — $${(item.price * item.quantity).toLocaleString()}`
    );
    const message = [
      "Hello, I would like to place the following order:",
      "",
      ...lines,
      "",
      `Subtotal: $${totalPrice.toLocaleString()}`,
      ...(discount ? [
        `Promo Code: ${discount.code} (−$${discount.discountAmount.toLocaleString()})`,
      ] : []),
      `Order Total: $${finalTotal.toLocaleString()}`,
      "",
      "Please confirm availability and payment details. Thank you.",
    ].join("\n");
    return `https://wa.me/17866824792?text=${encodeURIComponent(message)}`;
  };

  const handleCheckout = () => {
    // Count the redemption once the customer actually heads to WhatsApp
    if (discount) {
      apiFetch("/api/discounts/redeem", {
        method: "POST",
        body: JSON.stringify({ code: discount.code }),
      }).catch(() => {});
    }
    closeCart();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            data-testid="cart-backdrop"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col"
            data-testid="cart-drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-primary" />
                <h2 className="font-serif text-lg text-foreground">Your Selection</h2>
                {totalItems > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                data-testid="btn-close-cart"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <ShoppingBag size={48} className="text-border" />
                  <div>
                    <p className="font-serif text-xl text-foreground mb-2">Your cart is empty</p>
                    <p className="text-muted-foreground text-sm">Discover our collection and add your chosen fragrances.</p>
                  </div>
                  <Link href="/shop">
                    <span
                      onClick={closeCart}
                      className="inline-block border border-primary text-primary px-6 py-3 uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      data-testid="link-cart-browse"
                    >
                      Browse Collection
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.div
                        key={`${item.productId}-${item.size}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4 pb-6 border-b border-border last:border-0"
                        data-testid={`cart-item-${item.productId}-${item.size}`}
                      >
                        <Link href={`/product/${item.productId}`}>
                          <div onClick={closeCart} className="w-20 h-24 bg-card overflow-hidden shrink-0 cursor-pointer">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <Link href={`/product/${item.productId}`}>
                              <span
                                onClick={closeCart}
                                className="font-serif text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
                              >
                                {item.name}
                              </span>
                            </Link>
                            <button
                              onClick={() => removeItem(item.productId, item.size)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              data-testid={`btn-remove-${item.productId}-${item.size}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono block mb-3">
                            {item.size}
                          </span>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 border border-border">
                              <button
                                onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                data-testid={`btn-dec-${item.productId}-${item.size}`}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-sm font-mono text-foreground" data-testid={`qty-${item.productId}-${item.size}`}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                data-testid={`btn-inc-${item.productId}-${item.size}`}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-mono text-foreground text-sm">
                              ${(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-border shrink-0 space-y-4 bg-card">
                {/* Promo code */}
                {discount ? (
                  <div className="flex items-center justify-between border border-primary/30 bg-primary/5 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ticket size={14} className="text-primary shrink-0" />
                      <span className="font-mono text-sm text-primary tracking-wider truncate">{discount.code}</span>
                      <span className="text-xs text-muted-foreground shrink-0">−${discount.discountAmount.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => setDiscount(null)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
                      data-testid="btn-remove-promo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                        placeholder="PROMO CODE"
                        className="flex-1 min-w-0 bg-background border border-border border-r-0 px-3 py-2.5 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50 text-xs font-mono tracking-widest uppercase"
                        data-testid="input-promo-code"
                      />
                      <button
                        onClick={applyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="border border-primary text-primary px-4 py-2.5 uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
                        data-testid="btn-apply-promo"
                      >
                        {promoLoading && <Loader2 size={11} className="animate-spin" />}
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-destructive text-[10px] mt-1.5 font-mono">{promoError}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  {discount && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Subtotal</span>
                        <span className="font-mono text-sm text-muted-foreground line-through">${totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-primary font-mono">{discount.code}</span>
                        <span className="font-mono text-sm text-primary">−${discount.discountAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Order Total</span>
                    <span className="font-serif text-2xl text-foreground" data-testid="cart-total">${finalTotal.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Shipping calculated upon confirmation. Local pickup available.
                </p>

                {/* Refund Policy Agreement */}
                <div className="bg-muted/40 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2.5">
                    <span className="text-foreground font-semibold">All Sales Are Final.</span> We do not issue refunds to credit cards, debit cards, or digital wallets for change of mind, dislike of a scent, or accidental orders.
                  </p>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mt-0.5 accent-[hsl(var(--primary))] w-3.5 h-3.5 shrink-0 cursor-pointer"
                      data-testid="checkbox-refund-agree"
                    />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                      I agree to the <span className="text-foreground">no-refund policy</span> stated on this website.
                    </span>
                  </label>
                </div>

                <a
                  href={agreed ? buildWhatsAppMessage() : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={agreed ? handleCheckout : e => e.preventDefault()}
                  aria-disabled={!agreed}
                  className={`w-full py-4 flex items-center justify-center gap-3 uppercase tracking-widest text-sm font-semibold transition-all duration-200 ${agreed ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"}`}
                  data-testid="btn-checkout-whatsapp"
                >
                  <SiWhatsapp size={18} />
                  Confirm Order via WhatsApp
                </a>
                <button
                  onClick={clearCart}
                  className="w-full text-muted-foreground text-xs uppercase tracking-widest hover:text-foreground transition-colors py-1"
                  data-testid="btn-clear-cart"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
