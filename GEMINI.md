# FlowXtate - Tokenized Real Estate on XRPL

## 📋 Project Overview

FlowXtate adalah platform investasi real estate fraksional berbasis XRP Ledger yang memungkinkan investor membeli token properti, menerima dividen harian, dan melakukan trading 24/7 di Native DEX XRPL.

**Hackathon Goal:** Demokratisasi investasi real estate melalui tokenisasi dan fitur exit strategy yang unik (Acquisition via Clawback).

---

## ✅ Current Features (Sudah Dibuat)

### 1. **Landing Page**
- Hero section dengan animated background (yellow-white theme)
- Features showcase (6 fitur utama)
- How it works (3 steps)
- Featured properties (3 mock properties)
- Stats section (TVL, investors, properties)
- CTA section
- Footer

### 2. **Wallet Integration - Crossmark (Pure SDK)**
- Connect dengan Crossmark wallet menggunakan `@crossmarkio/sdk`
- Auto-detect Crossmark extension
- Sign in flow dengan `sdk.methods.signInAndWait()`
- Wallet status display di header
- Dropdown menu dengan copy address & disconnect
- Error handling yang proper

### 3. **UI Components (Shadcn)**
- Button, Card, Badge, Dialog, Dropdown Menu, Avatar
- Custom yellow-white theme (konsisten)
- Responsive design
- Clean typography dengan Inter font

### 4. **Tech Stack**
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS v4
- ✅ Shadcn UI components
- ✅ xrpl.js library
- ✅ Crossmark SDK v0.4.0
- ✅ Lucide React icons

---

## 🚀 Upcoming Features (Belum Dibuat)

### Phase 1: Frontend - Properties & Trading Flow

#### 1. **Properties Listing Page** (`/properties`)
- Grid layout dengan semua properties
- Filter by yield, price, location
- Search functionality
- Card untuk setiap property dengan info:
  - Name, location, image
  - Yield percentage
  - Min investment (RLUSD)
  - Token code (PROP001, etc)
  - Total supply & holders

#### 2. **Property Detail Page** (`/properties/[id]`)
- Property information lengkap:
  - Valuation total
  - Daily rent yield
  - Location & description
  - Images/gallery
- Stats & charts:
  - Total Value Locked (TVL)
  - Number of token holders
  - Daily dividend amount
  - Historical price chart (optional)
- Trading interface:
  - **Enable Trading Button** → Create Trustline
  - **Buy Tokens Button** → Create Offer di DEX
  - **Sell Tokens Button** → Create Sell Offer
  - Order book display (bids/asks)
  - Recent transactions
- Ownership info:
  - User's token balance
  - User's share percentage
  - Estimated daily dividend

#### 3. **Trustline Creation Flow**
- Modal dialog untuk setup trustline
- Steps:
  1. Explain trustline (user education)
  2. Sign transaction dengan Crossmark
  3. Submit ke XRPL
  4. Show success/error
- Progress indicator
- Success message dengan next action (buy tokens)

#### 4. **Buy/Sell Token Flow (Native DEX)**
- Input amount to buy/sell
- Calculate price berdasarkan order book
- Preview transaction (amount, price, total)
- Create OfferCreate transaction
- Sign dengan Crossmark
- Submit ke XRPL DEX
- Show transaction result
- Update balance & holdings

#### 5. **User Dashboard** (`/dashboard`)
- Portfolio overview:
  - Total investment value
  - Total token holdings
  - Daily dividend income
  - Historical performance
- List of owned properties:
  - Property cards dengan holdings
  - Current value vs purchase price
  - Accumulated dividends
- Transaction history:
  - Buy/sell transactions
  - Dividend payments
  - Acquisition payouts
- Quick actions:
  - Buy more tokens
  - Sell tokens
  - View property details

---

### Phase 2: Backend - Flask + XRPL Integration

#### 1. **Flask Backend Setup** (`/backend`)
```
/backend
  ├── app.py              # Main Flask app
  ├── routes/
  │   ├── properties.py   # Property endpoints
  │   ├── transactions.py # Transaction monitoring
  │   └── dividends.py    # Dividend distribution
  ├── services/
  │   ├── xrpl.py        # XRPL client wrapper
  │   ├── issuer.py      # Issuer wallet management
  │   └── clawback.py    # Acquisition logic
  ├── models/
  │   └── database.py    # Supabase client
  └── utils/
      └── helpers.py     # Helper functions
```

#### 2. **Token Preparation (Asset Controls)**
**Issuer Wallet Setup:**
- Create issuer wallet untuk setiap property
- Activate `lsfAllowTrustLineClawback` flag (WAJIB untuk Acquisition)
- Set issuer domain (optional untuk DID/verification)

**Token Minting:**
- Mint property tokens (e.g., PROP001) ke distribusi wallet
- Set total supply berdasarkan property valuation
- Configure transfer fee (optional)

**Example Code:**
```python
from xrpl.models.transactions import AccountSet, Payment
from xrpl.models.transactions.account_set import AccountSetAsfFlag

# Enable clawback on issuer account
account_set_tx = AccountSet(
    account=issuer_address,
    set_flag=AccountSetAsfFlag.ASF_ALLOW_TRUST_LINE_CLAWBACK
)

# Mint tokens to distribution account
payment_tx = Payment(
    account=issuer_address,
    destination=distribution_address,
    amount={
        "currency": "PROP001",
        "value": "1000000",  # Total supply
        "issuer": issuer_address
    }
)
```

#### 3. **API Endpoints**

**Properties:**
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property detail
- `GET /api/properties/:id/holders` - Get token holders
- `GET /api/properties/:id/orderbook` - Get DEX order book

**Transactions:**
- `POST /api/transactions/trustline` - Monitor trustline creation
- `POST /api/transactions/offer` - Monitor offer creation
- `GET /api/transactions/:wallet` - Get user transactions

**Dividends:**
- `POST /api/dividends/distribute` - Trigger dividend distribution (admin only)
- `GET /api/dividends/:wallet` - Get user dividend history

**Acquisition:**
- `POST /api/acquisition/initiate` - Start acquisition process
- `POST /api/acquisition/execute` - Execute clawback & payout

#### 4. **Dividend Distribution System**
**Daily Batch Distribution Logic:**
```python
# Scheduled job (runs at 00:00 daily)
def distribute_daily_dividends():
    properties = get_all_properties()

    for property in properties:
        # 1. Snapshot: Get all token holders
        holders = get_token_holders(property.token_code)

        # 2. Calculate: Daily rent / Total tokens
        dividend_per_token = property.daily_rent / property.total_supply

        # 3. Distribute: Send RLUSD to each holder
        for holder in holders:
            amount = holder.balance * dividend_per_token
            send_payment(
                from_account=operational_wallet,
                to_account=holder.address,
                amount_rlusd=amount
            )
```

#### 5. **Acquisition Feature (Killer Feature) 🚀**
**Scenario:** Investor "Sultan" ingin beli 100% properti.

**Flow:**
1. **Lock Funds:**
   - Sultan mengirim 100% valuasi ke escrow/operational wallet
   - Backend detect payment via webhook/polling

2. **Clawback Execution:**
   - Get all token holders
   - Loop: Clawback semua tokens dari holders ke issuer
   ```python
   from xrpl.models.transactions import Clawback

   for holder in token_holders:
       clawback_tx = Clawback(
           account=issuer_wallet.address,
           amount={
               "currency": "PROP001",
               "issuer": issuer_wallet.address,
               "value": holder.balance
           }
       )
       submit_transaction(clawback_tx)
   ```

3. **Refund/Payout:**
   - Calculate payout untuk setiap holder (proportional)
   - Send RLUSD dari Sultan's fund ke each holder
   ```python
   for holder in token_holders:
       payout_amount = (holder.balance / total_supply) * total_valuation
       send_payment(operational_wallet, holder.address, payout_amount)
   ```

4. **Transfer Ownership:**
   - Burn tokens atau transfer 100% ke Sultan
   - Update property status di database

---

### Phase 3: Database - Supabase

#### Schema Design:

**Table: `properties`**
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    issuer_address TEXT NOT NULL,
    token_code TEXT NOT NULL,
    total_valuation DECIMAL NOT NULL,
    total_supply DECIMAL NOT NULL,
    daily_rent_yield DECIMAL NOT NULL,
    status TEXT DEFAULT 'active', -- active, acquired
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `investors`**
```sql
CREATE TABLE investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    kyc_status TEXT DEFAULT 'pending', -- pending, verified (optional)
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `transactions`**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    property_id UUID REFERENCES properties(id),
    type TEXT NOT NULL, -- buy, sell, dividend, acquisition
    amount DECIMAL,
    token_amount DECIMAL,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    timestamp TIMESTAMP DEFAULT NOW()
);
```

**Table: `holdings`**
```sql
CREATE TABLE holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    property_id UUID REFERENCES properties(id),
    token_balance DECIMAL NOT NULL,
    average_buy_price DECIMAL,
    total_dividends_received DECIMAL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(wallet_address, property_id)
);
```

**Table: `dividend_payments`**
```sql
CREATE TABLE dividend_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id),
    wallet_address TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    tx_hash TEXT,
    payment_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - Landing Page                                              │
│  - Properties Listing                                        │
│  - Property Detail + Trading                                 │
│  - User Dashboard                                            │
│  - Wallet Connection (Crossmark)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Backend (Flask)                           │
│  - Property Management                                       │
│  - Transaction Monitoring                                    │
│  - Dividend Distribution (Daily Cron)                        │
│  - Acquisition Logic (Clawback)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
┌─────────▼─────────┐   ┌────────▼────────┐
│   Supabase DB     │   │   XRP Ledger    │
│  - Properties     │   │  - Issuer       │
│  - Transactions   │   │  - DEX Orders   │
│  - Holdings       │   │  - Trustlines   │
│  - Dividends      │   │  - Clawback     │
└───────────────────┘   └─────────────────┘
```

---

## 🔑 Key Technical Decisions

### 1. **Dashboard Separation: Issuer vs User**
**Recommendation: PISAH**

**Issuer Dashboard** (`/issuer`):
- Create new property listings
- Mint tokens
- Configure issuer settings
- Monitor property performance
- Trigger acquisition (clawback)
- Manage operational wallet

**User Dashboard** (`/dashboard`):
- View portfolio
- Track dividends
- Transaction history
- Buy/sell tokens

**Why?** Different use cases, different permissions, cleaner UX.

### 2. **Multi-Token per Issuer**
**YES - Satu issuer bisa issue banyak token**

Example:
```
Issuer: rISSUER123...
├── PROP001 (Jakarta Office)
├── PROP002 (Bali Villa)
└── PROP003 (Surabaya Mall)
```

**Implementation:**
- Setiap property = 1 issuer wallet
- Atau: 1 issuer master, multiple token currencies
- Recommendation: **1 issuer per property** (cleaner accounting)

### 3. **Multi-Sig Wallet Support**
**YES - XRPL supports multi-signature via SignerList**

**Use Cases:**
- Issuer wallet dengan multiple signers (security)
- Operational wallet dengan multi-approval
- Escrow wallet untuk acquisition

**Implementation:**
```python
from xrpl.models.transactions import SignerListSet

# Setup multi-sig (e.g., 2-of-3)
signer_list_tx = SignerListSet(
    account=wallet_address,
    signer_quorum=2,
    signer_entries=[
        {"account": signer1, "signer_weight": 1},
        {"account": signer2, "signer_weight": 1},
        {"account": signer3, "signer_weight": 1}
    ]
)
```

---

## 🛠️ Development Roadmap

### Week 1: Frontend Foundation ✅ DONE
- [x] Landing page
- [x] Crossmark wallet integration
- [x] UI components setup
- [x] Color theme (yellow-white)

### Week 2: Properties & Trading (NEXT)
- [ ] Properties listing page
- [ ] Property detail page
- [ ] Trustline creation flow
- [ ] Buy/sell token flow (DEX integration)
- [ ] User dashboard

### Week 3: Backend & Integration
- [ ] Flask backend setup
- [ ] Supabase schema & data
- [ ] Issuer wallet creation
- [ ] Token minting
- [ ] API endpoints
- [ ] Connect frontend to backend

### Week 4: Advanced Features
- [ ] Daily dividend distribution
- [ ] Acquisition feature (clawback)
- [ ] Transaction monitoring
- [ ] Issuer dashboard
- [ ] Testing & polish

---

## 📚 Resources

### XRPL Documentation:
- [Issued Currencies](https://xrpl.org/issued-currencies-overview.html)
- [Clawback](https://xrpl.org/clawback.html)
- [Decentralized Exchange](https://xrpl.org/decentralized-exchange.html)
- [Trustlines](https://xrpl.org/trust-lines-and-issuing.html)

### Libraries:
- [xrpl-py](https://github.com/XRPLF/xrpl-py) - Python library
- [xrpl.js](https://github.com/XRPLF/xrpl.js) - JavaScript library
- [Crossmark SDK](https://docs.crossmark.io/) - Wallet integration

### Deployment:
- Frontend: Vercel (Next.js)
- Backend: Vercel Serverless Functions atau Railway/Render
- Database: Supabase (PostgreSQL)
- Cron Jobs: Vercel Cron atau external scheduler

---

## ⚠️ Important Notes

1. **Clawback Requirement:** Issuer MUST enable `lsfAllowTrustLineClawback` BEFORE issuing tokens. Cannot be changed later!

2. **DEX vs Database:** Jangan buat matching engine sendiri. Pakai Native DEX XRPL. Backend hanya monitor & update status.

3. **Dividend Distribution:** Daily batch lebih efisien daripada real-time streaming (biaya fee lebih rendah).

4. **Security:**
   - Never expose seed/private keys
   - Use environment variables
   - Validate all transactions
   - Rate limiting on APIs

5. **Testnet First:** Develop di XRPL Testnet dulu sebelum mainnet!

---

## 🚀 Quick Start (Current State)

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open browser
http://localhost:3000
```

**Current Features Working:**
- Landing page with animations
- Crossmark wallet connect/disconnect
- Responsive design
- Yellow-white theme

**Next Step:** Build Properties page!

---

**Last Updated:** January 2025
**Status:** Landing page & wallet integration complete ✅
**Next Milestone:** Properties listing & DEX trading 🚧
