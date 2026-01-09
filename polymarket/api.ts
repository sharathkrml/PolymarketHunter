// curl --request GET \
//   --url 'https://clob.polymarket.com/book?token_id=22295259436110767783616540495046859443466300821355106046285397058271830670917'


export type OrderBook = {
 market: string;
 asset_id: string;
 timestamp: string;
 hash: string;
 bids: {
  price: string;
  size: string;
 }[];
 asks: {
  price: string;
  size: string;
 }[];
 min_order_size: string;
 tick_size: string;
 neg_risk: boolean;
 last_trade_price: string;
}

export const getMarketData = async (assetId: string) => {
 const response = await fetch(`https://clob.polymarket.com/book?token_id=${assetId}`);
 const data = await response.json() as OrderBook;
 return data;
}

export type MarketsTraded = {
 user: string;
 traded: number;
}

// curl--request GET \
// --url 'https://data-api.polymarket.com/traded?user=0x70b680D8035B3255fe61488AFFd10bBD3498aA2F'

export const getMarketsTraded = async (userAddress: string) => {
 const response = await fetch(`https://data-api.polymarket.com/traded?user=${userAddress}`);
 const data = await response.json() as MarketsTraded;
 return data;
}
