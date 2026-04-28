import { useEffect, useState } from "react";
import api from "../utils/api";
import type { Ad } from "../hooks/useAds";

interface UseAdResult {
  ad: Ad | null;
  seller: any | null;
  isLoading: boolean;
  error: string | null;
}

export function useAd(id: string | undefined): UseAdResult {
  const [ad, setAd] = useState<Ad | null>(null);
  const [seller, setSeller] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No ad id provided");
      setIsLoading(false);
      return;
    }

    const fetchAd = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await api.get(`/ads/${id}`);
        const body = res.data;

        // handle:
        // 1) { data: { ad, seller } }
        // 2) { data: adDoc }
        const rawAd =
          body?.data?.ad ??
          body?.data ??
          null;

        const rawSeller =
          body?.data?.seller ??
          rawAd?.user ??
          null;

        if (!rawAd) {
          throw new Error(body?.message || "Ad not found");
        }

        const maxQ =
          rawAd.maxQuantity ??
          rawAd.quantity_available ??
          0;
        const minQ =
          rawAd.minQuantity ??
          rawAd.min_qty ??
          0;

        const normalizedAd: Ad = {
          id: rawAd._id ?? rawAd.id,
          title: rawAd.title,
          token_name: rawAd.tokenName ?? rawAd.token_name,
          price_per_unit: Number(
            rawAd.pricePerUnit ?? rawAd.price_per_unit ?? 0
          ),
          quantity_available: maxQ || minQ || 0,
          min_qty: minQ,
          max_qty: maxQ,
          image_url: rawAd.imageUrl ?? rawAd.image_url ?? null,
          status: rawAd.status,
          direction: rawAd.direction,
          location_city: rawAd.locationCity ?? rawAd.location_city,
          location_state: rawAd.locationState ?? rawAd.location_state,
          user_name: rawAd.user?.name,
        };

        setAd(normalizedAd);
        setSeller(rawSeller);
      } catch (err: any) {
        console.error("Failed to fetch ad:", err);
        setError(
          err?.message || "Failed to load ad details"
        );
        setAd(null);
        setSeller(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  return { ad, seller, isLoading, error };
}
