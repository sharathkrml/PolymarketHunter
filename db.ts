import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
});



const insertQuery =
 `
CREATE TABLE IF NOT EXISTS polymarket.user_budgets (
    user_id BIGINT PRIMARY KEY,
    budget_threshold NUMERIC
);

`

const createTable = async () => {
 try {
  await pool.query(insertQuery);
  console.log("Table created successfully");
 } catch (error) {
  console.error("Error creating table:", error);
 }
}
// update table and add field liquidity_threshold
const updateQuery =
 `
ALTER TABLE polymarket.user_budgets
ADD liquidity_threshold NUMERIC;
`


const updateTable = async () => {
 try {
  await pool.query(updateQuery);
  console.log("Table updated successfully");
 } catch (error) {
  console.error("Error updating table:", error);
 }
}

export const saveBudget = async (userId: number, budget: number, liquidityThreshold: number = 5) => {
 const query = `
    INSERT INTO polymarket.user_budgets (user_id, budget_threshold, liquidity_threshold)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET budget_threshold = $2, liquidity_threshold = $3;
  `;
 await pool.query(query, [userId, budget, liquidityThreshold]);
};

export const getUsersForTrade = async (amount: number, liquidityThreshold: number = 5) => {
 const res = await pool.query(
  'SELECT user_id FROM polymarket.user_budgets WHERE budget_threshold <= $1 OR liquidity_threshold <= $2',
  [amount, liquidityThreshold]
 );
 return res.rows.map((row) => row.user_id);
};

export default pool;

