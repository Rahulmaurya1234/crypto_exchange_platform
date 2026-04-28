import { useState, useEffect } from "react";
import api from "../utils/api";

export interface Ad {
  id: string;
  title: string;
  token_name: string;
  price_per_unit: number;
  quantity_available: number;
  min_qty: number;
  max_qty: number;
  image_url: string | null;
  status?: string;
  direction?: "buy" | "sell" | string;
  location_city?: string;
  location_state?: string;
  user_name?: string;
}

interface AdFilters {
  token_name?: string;
  direction?: string;
  city?: string;
  min_price?: string;
  max_price?: string;
  page?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useAds(filters?: AdFilters) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // map React filters -> backend expected query params
      if (filters?.token_name)
        params.append("tokenName", filters.token_name); // backend uses tokenName
      if (filters?.direction)
        params.append("direction", filters.direction);
      if (filters?.city) params.append("city", filters.city);
      if (filters?.min_price)
        params.append("minPrice", filters.min_price);
      if (filters?.max_price)
        params.append("maxPrice", filters.max_price);
      if (filters?.page)
        params.append("page", String(filters.page));

      const res = await api.get("/ads", { params });

      // Actual shape:
      // {
      //   statusCode,
      //   data: {
      //     ads: [...],
      //     pagination: { page, limit, total, totalPages }
      //   },
      //   message,
      //   success
      // }
      const adsArray =
        res.data?.data?.ads ??
        res.data?.ads ??
        [];

      const paginationData =
        res.data?.data?.pagination ??
        res.data?.pagination ??
        {};

      const normalized: Ad[] = (adsArray as any[]).map((ad: any) => {
        const maxQ = ad.maxQuantity ?? 0;
        const minQ = ad.minQuantity ?? 0;
        return {
          id: ad._id ?? ad.id,
          title: ad.title,
          token_name: ad.tokenName,
          price_per_unit: Number(ad.pricePerUnit ?? 0),
          quantity_available:
            ad.quantityAvailable ??
            maxQ ??
            minQ ??
            0,
          min_qty: minQ,
          max_qty: maxQ,
          image_url: ad.imageUrl ?? null,
          status: ad.status,
          direction: ad.direction,
          location_city: ad.locationCity,
          location_state: ad.locationState,
          user_name: ad.user?.name,
        };

      });

      setAds(normalized);
      setPagination({
        page: paginationData.page ?? 1,
        limit: paginationData.limit ?? 20,
        total: paginationData.total ?? normalized.length,
        totalPages: paginationData.totalPages ?? 1,
      });
    } catch (err) {
      console.error("Failed to fetch ads:", err);
      setError("Failed to load ads");
      setAds([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
    // filters is an object; stringify so dependency works
  }, [JSON.stringify(filters)]);

  return { ads, isLoading, error, pagination };
}
