User Journey
Product goal
Let users define what kind of trader they want to track and receive real-time Telegram alerts whenever a matching trade happens.

1. Entry point
   User opens the Telegram bot.
   Bot:
   “Track Polymarket traders in real time.
   Set filters once. Get notified whenever a matching trade happens.”
   Button
   Start

2. Define market activity
   Bot:
   “Maximum number of markets the wallet has traded in?”
   Options
   Less than 5
   Less than 20
   Less than 50
   Less than 100
   Any
   Bot confirms selection.

3. Define bet amount
   Bot:
   Minimum amount deployed for a trade by the wallet”
   Options
   Less than 1,000
   Less than 10,000
   Less than 50,000
   Less than 100,000
   Custom
   Bot confirms selection.

4. Define liquidity percentage
   Bot:
   Minimum liquidity percentage provided by the trader
   Options
   5% 
   10%
   Custom
   Bot confirms.

5. Activate monitoring
   Bot:
   “Your filter is ready.
   We will now watch Polymarket for any trades that match your criteria.”
   Button
   Start monitoring

6. Real-time alerts
   Whenever any Polymarket trade is made by a wallet that matches all the selected filters, the user gets a Telegram message.
   Example:
   “New matching trade detected
   Wallet: 0xA91…B2
   Wallet age: 12 days
   Markets traded: 7
   Total capital: 4,800
   Market: Will BTC be above 70k by March
   Action: Bought YES
   Size: 620
   Price: 0.58”
