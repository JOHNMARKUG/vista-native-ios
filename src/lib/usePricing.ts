import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CACHE_KEY = 'vista_prices_v1';

export const DEFAULT_PRICES = {
  // Flat per-vehicle fares (not per-passenger — see AirportTransferScreen).
  airport_pickup: 35,
  ministry_transport: 50,
  group_convoy: 300,
  city_transfer: 60,
  airport_departure: 40,
  crusade: 50,
  conference: 80,
  vip: 150,
  platform_fee: 15,
  ugx_rate: 3700,
  hourly_standard_per_hour: 40000,
  hourly_premium_per_hour: 65000,
  pilgrimage_package: 150,
  // VISTA Rides — per vehicle type (Admin > Pricing tab)
  vista_boda_base: 1000,
  vista_boda_per_km: 500,
  vista_boda_min: 3000,
  vista_std_base: 1500,
  vista_std_per_km: 1800,
  vista_std_min: 8000,
  vista_prem_base: 3000,
  vista_prem_per_km: 2500,
  vista_prem_min: 15000,
  vista_inter_base: 5000,
  vista_inter_per_km: 2000,
  vista_inter_min: 30000,
} as const;

export type PricingTable = typeof DEFAULT_PRICES;

export function usePricing(): PricingTable {
  const [prices, setPrices] = useState<PricingTable>(DEFAULT_PRICES);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(CACHE_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        setPrices({ ...DEFAULT_PRICES, ...JSON.parse(raw) });
      } catch {
        // ignore malformed cache
      }
    });

    supabase
      .from('settings')
      .select('data')
      .eq('id', 'platform_pricing')
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled || error) return;
        const row = (data as { data?: Partial<PricingTable> }[] | null)?.[0];
        if (!row?.data) return;
        const fetched = { ...DEFAULT_PRICES, ...row.data };
        setPrices(fetched);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(row.data)).catch(() => {});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return prices;
}
