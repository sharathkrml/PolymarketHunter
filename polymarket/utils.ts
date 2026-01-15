import { getMarketData } from "./api"

export const getLiquidityPercentage = async (
  marketId: string,
  tradeValue: number
) => {
  try {
    const orderBook = await getMarketData(marketId)
    // Calculate total liquidity in dollars (size * price) for both bids and asks
    const totalLiquidity =
      orderBook.bids.reduce((acc, bid) => acc + Number(bid.size) * Number(bid.price), 0) +
      orderBook.asks.reduce((acc, ask) => acc + Number(ask.size) * Number(ask.price), 0)

    // Prevent division by zero or very small numbers
    if (totalLiquidity <= 0) {
      return 0
    }

    const liquidityPercent = (tradeValue / totalLiquidity) * 100
    // Cap at 100% to handle edge cases
    return Math.min(liquidityPercent, 100)
  } catch (error) {
    return 0
  }
}
