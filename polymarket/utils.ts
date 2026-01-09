import { getMarketData } from "./api";

export const getLiquidityPercentage = async (marketId: string, tradeValue: number) => {
 const orderBook = await getMarketData(marketId);
 const totalLiquidity = orderBook.bids.reduce((acc, bid) => acc + Number(bid.size), 0) + orderBook.asks.reduce((acc, ask) => acc + Number(ask.size), 0);

 const liquidityPercent = (tradeValue / totalLiquidity) * 100;
 return liquidityPercent;
}