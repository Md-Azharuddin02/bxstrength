import { useEffect, useState } from 'react';
import { getActiveMarketCountry, getMarketConfig } from '../../../utils/marketService';
import type { MarketCountry } from '../../../types';

export const useServiceMarket = () => {
  const [activeMarketCountry, setActiveMarketCountry] = useState<MarketCountry>(getActiveMarketCountry());

  useEffect(() => {
    const handleMarketChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ country: MarketCountry }>;
      if (customEvent.detail?.country) {
        setActiveMarketCountry(customEvent.detail.country);
      } else {
        setActiveMarketCountry(getActiveMarketCountry());
      }
    };

    window.addEventListener('bxstrength_market_changed', handleMarketChange);
    return () => window.removeEventListener('bxstrength_market_changed', handleMarketChange);
  }, []);

  return getMarketConfig(activeMarketCountry);
};
