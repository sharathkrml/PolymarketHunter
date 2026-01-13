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

const updateQuery5 = `
ALTER TABLE polymarket.user_budgets
ADD COLUMN IF NOT EXISTS is_monitoring_active BOOLEAN DEFAULT TRUE;
`

const updateTable = async () => {
  try {
    await pool.query(updateQuery4)
    console.log("Table updated successfully")
  } catch (error) {
    console.error("Error updating table:", error)
  }
}

const addMonitoringStatus = async () => {
  try {
    await pool.query(updateQuery5)
    console.log("Monitoring status column added successfully")
  } catch (error) {
    console.error("Error adding monitoring status column:", error)
  }
}

export const updateMaxMarketsTraded = async (
  userId: number,
  maxMarketsTraded: number
) => {
  const query = `
    UPDATE polymarket.user_budgets SET max_markets_traded = $2 WHERE user_id = $1;
  `
  return await pool.query(query, [userId, maxMarketsTraded])
}

export const updateLiquidityThreshold = async (
  userId: number,
  liquidityThreshold: number
) => {
  const query = `
    UPDATE polymarket.user_budgets SET liquidity_threshold = $2 WHERE user_id = $1;
  `
  return await pool.query(query, [userId, liquidityThreshold])
}

export const updateTradeThreshold = async (
  userId: number,
  tradeThreshold: number
) => {
  const query = `
    UPDATE polymarket.user_budgets SET budget_threshold = $2 WHERE user_id = $1;
  `
  return await pool.query(query, [userId, tradeThreshold])
}

export const saveBudget = async (
  userId: number,
  budget: number,
  liquidityThreshold: number = 5
) => {
  const query = `
    INSERT INTO polymarket.user_budgets (user_id, budget_threshold, liquidity_threshold, is_monitoring_active)
    VALUES ($1, $2, $3, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET budget_threshold = $2, liquidity_threshold = $3, is_monitoring_active = TRUE;
  `
  return await pool.query(query, [userId, budget, liquidityThreshold])
}

export const saveCompleteSettings = async (
  userId: number,
  budget: number,
  liquidityThreshold: number,
  maxMarketsTraded: number
) => {
  const query = `
    INSERT INTO polymarket.user_budgets (user_id, budget_threshold, liquidity_threshold, max_markets_traded, is_monitoring_active)
    VALUES ($1, $2, $3, $4, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET 
      budget_threshold = $2, 
      liquidity_threshold = $3, 
      max_markets_traded = $4,
      is_monitoring_active = TRUE;
  `
  return await pool.query(query, [
    userId,
    budget,
    liquidityThreshold,
    maxMarketsTraded,
  ])
}

export const setMonitoringStatus = async (
  userId: number,
  isActive: boolean
) => {
  const query = `
    UPDATE polymarket.user_budgets 
    SET is_monitoring_active = $2 
    WHERE user_id = $1;
  `
  return await pool.query(query, [userId, isActive])
}

export const isMonitoringActive = async (userId: number): Promise<boolean> => {
  const res = await pool.query(
    "SELECT is_monitoring_active FROM polymarket.user_budgets WHERE user_id = $1",
    [userId]
  )
  return res.rows[0]?.is_monitoring_active ?? false
}

export const getUsersForTrade = async (
  amount: number,
  liquidityThreshold: number = 5
) => {
  const res = await pool.query(
    "SELECT user_id, max_markets_traded FROM polymarket.user_budgets WHERE (budget_threshold <= $1 OR liquidity_threshold <= $2) AND is_monitoring_active = TRUE",
    [amount, liquidityThreshold]
  )
  return res.rows.map((row) => ({
    user_id: row.user_id,
    max_markets_traded: row.max_markets_traded,
  }))
}

export const getUserBudget = async (userId: number) => {
  const res = await pool.query(
    "SELECT budget_threshold, liquidity_threshold, max_markets_traded, is_monitoring_active FROM polymarket.user_budgets WHERE user_id = $1",
    [userId]
  )
  return res.rows[0]
}

export default pool

// addMonitoringStatus()
