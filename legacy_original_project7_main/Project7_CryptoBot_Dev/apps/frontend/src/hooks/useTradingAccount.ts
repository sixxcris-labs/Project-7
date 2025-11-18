import useSWR from 'swr';
import { fetchAccount } from '../services/api/tradingApi';

export function useTradingAccount() {
  return useSWR('/binance/account', fetchAccount, { refreshInterval: 10000 });
}
