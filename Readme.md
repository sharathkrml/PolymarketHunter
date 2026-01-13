# Polymarket Hunter

A real-time Telegram bot that monitors Polymarket trades and sends instant alerts when trades match your custom criteria. Track smart money traders, significant trades, and liquidity events on Polymarket 24/7.

## 🎯 Features

- **Real-time Monitoring**: Connects to Polymarket's WebSocket API to monitor trades as they happen
- **Customizable Filters**: Set up personalized alert criteria:
  - Maximum markets traded by a wallet
  - Minimum trade size (USD)
  - Minimum liquidity percentage provided by the trader
- **Smart Alert Logic**: Receive alerts when **either** trade size **OR** liquidity threshold is met (or both)
- **User-Friendly Interface**: Interactive Telegram bot with step-by-step configuration flow
- **Monitoring Control**: Pause and resume monitoring anytime without losing your settings
- **Trader Insights**: View trader profiles and trading history directly from alerts

## 🏗️ Architecture

The project consists of two main services:

1. **Bot Service** (`bot.ts`): Telegram bot interface that handles user interactions, configuration, and command processing
2. **Monitor Service** (`monitor.ts`): Real-time monitoring service that connects to Polymarket WebSocket, filters trades, and sends alerts to users

### Key Components

- **`bot.ts`**: Grammy-based Telegram bot with interactive configuration flow
- **`monitor.ts`**: WebSocket client that monitors Polymarket trades and triggers alerts
- **`db.ts`**: PostgreSQL database operations for user settings and preferences
- **`polymarket/`**: Polymarket API integration
  - `client.ts`: WebSocket client for real-time data
  - `api.ts`: REST API client for market data and trader information
  - `utils.ts`: Utility functions for liquidity calculations
  - `model.ts`: TypeScript type definitions

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Telegram Bot Token (get one from [@BotFather](https://t.me/botfather))
- Docker and Docker Compose (for containerized deployment)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PolymarketHunterV2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=postgresql://user:password@host:port/database
```

**Note**: The database schema should include a `polymarket` schema. The application will create the `user_budgets` table automatically.

### 4. Database Setup

Ensure your PostgreSQL database has the `polymarket` schema:

```sql
CREATE SCHEMA IF NOT EXISTS polymarket;
```

The application will automatically create the `user_budgets` table with the following structure:
- `user_id` (BIGINT PRIMARY KEY)
- `budget_threshold` (NUMERIC)
- `liquidity_threshold` (NUMERIC)
- `max_markets_traded` (INT)
- `is_monitoring_active` (BOOLEAN)
- `is_blocked` (BOOLEAN)

### 5. Build the Project

```bash
npm run build
```

### 6. Run the Services

**Option A: Run individually**

```bash
# Start the bot service
npm start

# In another terminal, start the monitor service
npm run monitor
```

**Option B: Use Docker Compose**

```bash
docker-compose up -d
```

This will start both services in separate containers.

## 📱 Usage

### Bot Commands

- `/start` - Start the bot and configure alert filters
- `/status` or `/info` - View your current settings and monitoring status
- `/reset` - Reset and reconfigure your filters
- `/stop` - Pause monitoring and stop receiving alerts
- `/start_monitoring` - Resume monitoring and start receiving alerts

### Configuration Flow

1. **Start Setup**: Use `/start` and click "Set Up Alerts"
2. **Market Activity**: Choose the maximum number of markets a wallet should have traded in (Less than 5, 20, 50, 100, or Any)
3. **Trade Size**: Set the minimum trade size in USD (preset options or custom amount)
4. **Liquidity**: Set the minimum liquidity percentage (5%, 10%, or custom)
5. **Activate**: Review your settings and activate monitoring

### Alert Example

When a matching trade is detected, you'll receive a message like:

```
🚨 Insider Alert!

🔥 BUY 150.00 shares of YES @ $0.58

📌 Market: Will BTC be above 70k by March
💰 Value: $87.00
💧 Liquidity By User: 12.5%

✅ Triggered by: Trade size threshold

👤 Trader: [View Profile](https://polymarket.com/profile/0x...)
📊 History: 7 markets traded

🔗 [View Event](https://polymarket.com/event/...)
```

## 🔧 Development

### Project Structure

```
PolymarketHunter/
├── bot.ts              # Telegram bot service
├── monitor.ts          # Real-time monitoring service
├── db.ts              # Database operations
├── polymarket/        # Polymarket integration
│   ├── client.ts      # WebSocket client
│   ├── api.ts         # REST API client
│   ├── utils.ts       # Utility functions
│   └── model.ts       # Type definitions
├── dist/              # Compiled JavaScript (generated)
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile         # Docker image definition
└── package.json       # Dependencies and scripts
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the bot service
- `npm run monitor` - Run the monitor service

### Tech Stack

- **TypeScript**: Type-safe development
- **Grammy**: Modern Telegram bot framework
- **PostgreSQL**: User data and settings storage
- **WebSocket**: Real-time Polymarket data streaming
- **Docker**: Containerized deployment

## 🐳 Docker Deployment

The project includes Docker support for easy deployment:

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Both services run in separate containers and share the same environment variables.

## 🔒 Security Notes

- Never commit your `.env` file or expose your `BOT_TOKEN`
- Use environment variables for sensitive configuration
- Ensure your database connection is secure
- The bot automatically handles users who block it

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Note**: This bot is for informational purposes only. Always do your own research before making trading decisions.

