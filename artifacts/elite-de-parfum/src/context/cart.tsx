import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface CartItem {
  productId: string;
  name: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CART_STORAGE_KEY = "elite-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate each item has the required fields
    return parsed.filter(
      (i: unknown) =>
        typeof i === "object" &&
        i !== null &&
        "productId" in i &&
        "name" in i &&
        "size" in i &&
        "price" in i &&
        "quantity" in i
    ) as CartItem[];
  } catch {
    return [];
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.productId === newItem.productId && i.size === newItem.size
      );
      if (existing) {
        return prev.map(i =>
          i.productId === newItem.productId && i.size === newItem.size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.productId === productId && i.size === size ? { ...i, quantity } : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, totalItems, totalPrice,
      addItem, removeItem, updateQuantity, clearCart,
      openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
