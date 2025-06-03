import { RestClientV5 } from 'bybit-api';

// Initialize API client
export const client = new RestClientV5({
  key: process.env.NEXT_PUBLIC_BYBIT_API_KEY || '',
  secret: process.env.NEXT_PUBLIC_BYBIT_API_SECRET || '',
  testnet: false,
});

