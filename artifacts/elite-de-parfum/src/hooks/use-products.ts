import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/api";

export interface ApiProduct {
  id: string;
  name: string;
  family: string;
  gender: string;
  price: number;
  imageUrl: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  description: string;
  featured: boolean;
  inStock: boolean;
  images: string;
  sizes: string;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export function useProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/products"), { credentials: "include" });
      const data = await res.json() as { products: ApiProduct[] };
      setProducts(data.products ?? []);
      setError(null);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
