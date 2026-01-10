import { Pool } from "pg"
import * as dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const insertQuery = `
CREATE TABLE IF NOT EXISTS polymarket.user_budgets (
    user_id BIGINT PRIMARY KEY,
    budget_threshold NUMERIC
);

`

const createTable = async () => {
  try {
    await pool.query(insertQuery)
    console.log("Table created successfully")
  } catch (error) {
    console.error("Error creating table:", error)
  }
}
// update table and add field liquidity_threshold
const updateQuery = `
ALTER TABLE polymarket.user_budgets
ADD liquidity_threshold NUMERIC;
`

const updateQuery2 = `
ALTER TABLE polymarket.user_budgets
ALTER COLUMN liquidity_threshold SET DEFAULT 5;
`
const updateQuery3 = `
ALTER TABLE polymarket.user_budgets
ADD COLUMN max_markets_traded INT DEFAULT 0;
ALTER TABLE polymarket.user_budgets
ADD COLUMN consider_markets_traded BOOLEAN DEFAULT FALSE;
`

const updateQuery4 = `
ALTER TABLE polymarket.user_budgets
DROP COLUMN consider_markets_traded;
`
const updateTable = async () => {
  try {
    await pool.query(updateQuery4)
    console.log("Table updated successfully")
  } catch (error) {
    console.error("Error updating table:", error)
  }
}

export const updateMaxMarketsTraded = async (
  userId: number,
  maxMarketsTraded: number
) => {
  const query = `
    UPDATE polymarket.user_budsets SET max_markets_traded = $2 WHERE user_id = $1;
  `
  await pool.query(query, [userId, maxMarketsTraded])
}

export const updateLiquidityThreshold = async (
  userId: number,
  liquidityThreshold: number
) => {
  const query = `
    UPDATE polymarket.user_budsets SET liquidity_threshold = $2 WHERE user_id = $1;
  `
  await pool.query(query, [userId, liquidityThreshold])
}

export const updateTradeThreshold = async (
  userId: number,
  tradeThreshold: number
) => {
  const query = `
    UPDATE polymarket.user_budsets SET budget_threshold = $2 WHERE user_id = $1;
  `
  await pool.query(query, [userId, tradeThreshold])
}

export const saveBudget = async (
  userId: number,
  budget: number,
  liquidityThreshold: number = 5
) => {
  const query = `
    INSERT INTO polymarket.user_budgets (user_id, budget_threshold, liquidity_threshold)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET budget_threshold = $2, liquidity_threshold = $3;
  `
  await pool.query(query, [userId, budget, liquidityThreshold])
}

export const getUsersForTrade = async (
  amount: number,
  liquidityThreshold: number = 5
) => {
  const res = await pool.query(
    "SELECT user_id, max_markets_traded FROM polymarket.user_budgets WHERE budget_threshold <= $1 OR liquidity_threshold <= $2",
    [amount, liquidityThreshold]
  )
  return res.rows.map((row) => ({
    user_id: row.user_id,
    max_markets_traded: row.max_markets_traded,
  }))
}

export const getUserBudget = async (userId: number) => {
  const res = await pool.query(
    "SELECT budget_threshold, liquidity_threshold, max_markets_traded FROM polymarket.user_budgets WHERE user_id = $1",
    [userId]
  )
  return res.rows[0]
}

export default pool
