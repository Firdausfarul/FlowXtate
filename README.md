# FlowXtate - Tokenized Real Estate on XRPL 🏠🚀

FlowXtate is a fractional real estate investment platform built on the **XRP Ledger (XRPL)**. It democratizes access to high-yield property investments by tokenizing real-world assets, allowing anyone to own a piece of a property and earn daily rental dividends.

---

## 🌟 Key XRPL Features Used

FlowXtate leverages the advanced features of the XRP Ledger to provide a secure, liquid, and innovative investment experience.

### 1. **Native DEX (Order Book Architecture & Automated IDO)**
We utilize the XRPL's built-in Central Limit Order Book (CLOB) to provide 24/7 liquidity and a seamless launchpad for new assets.

- **Automated Initial Offering (IDO):** When a new property is tokenized on FlowXtate, the platform automatically triggers an `OfferCreate` transaction. This places the entire initial supply on the Native DEX as a sell offer at the target valuation price. This ensures that every property has **Instant Liquidity** and a transparent public price from the moment of creation.
- **Why DEX over AMM?** We intentionally avoided the XRPL AMM (Constant Product) for property tokens. Real estate transactions are typically large relative to the liquidity pool; in a constant product AMM, this would cause massive **Price Impact (Slippage)**. By using the Native DEX Order Book, we allow for precise pricing and institutional-grade trading without the inefficiencies of an AMM formula.
- **How we used it:** Every property token is paired with native **XRP** or other stablecoins. Users can place **Limit Orders** to buy into the initial offering or trade in the secondary market.

### 2. **Clawback (The "Acquisition" & Asset Recovery Engine)**
In traditional real estate and private equity, one of the greatest hurdles for fractionalized assets is the **Coordination Problem**. When an institutional buyer or a single entity expresses a desire to acquire 100% of a property to repurpose or sell it, coordinating hundreds of small, geographically dispersed fractional holders is nearly impossible. This often leads to "deadlock" where the asset becomes illiquid or undervalued.

- **Inspired by M&A:** Taking a leaf out of the "Merger and Acquisition" playbooks in the stock market, FlowXtate implements a streamlined acquisition flow. This feature allows the platform to overcome the fragmentation of ownership that typically kills large-scale deals.
- **How we used it:** 
    - **Resolution of Deadlock:** When a 100% acquisition offer is verified and funded, the platform utilizes the XRPL **Clawback** functionality to programmatically retrieve property tokens from all current holders. 
    - **Automated Payouts:** Simultaneously, the system ensures an equitable exit by distributing the fair-share payout in native assets directly to the holders' wallets. This creates a "Guaranteed Exit Strategy" for small investors, ensuring they aren't trapped in a deadlocked asset.
    - **Asset Protection:** Beyond M&A, Clawback serves as our primary tool for **Hack Recovery**. If an investor's wallet is compromised, the issuer can verify the claim and return the tokens to a secure wallet, providing the same level of security found in traditional banking.
- **Requirement:** All property issuer accounts are initialized with the `lsfAllowTrustLineClawback` flag enabled.

### 3. **Freeze Functionality (Regulatory Compliance)**
To comply with global real estate regulations, the platform can restrict token movement under specific legal conditions.
- **How we used it:** We leverage XRPL's **Global Freeze** and **Individual Freeze** flags. This allows the platform to halt trading of a specific property token if legal disputes arise, ensuring the platform remains compliant with local laws.

### 4. **Whitelisting via Trustlines & DID**
Real estate is a regulated asset that often requires KYC/AML.
- **How we used it:** By requiring **Trustlines**, we create a natural whitelisting mechanism. Only users who have been verified and have explicitly "trusted" the issuer can hold the tokens. Combined with **Decentralized Identifiers (DID)**, we ensure that every token holder is a verified investor.

### 5. **Path Payments (Seamless Swaps)**
FlowXtate provides a "Swap" interface that makes investing easy, even if you don't hold the required currency.
- **How we used it:** We use `ripple_path_find` to find the most efficient route between currencies. A user can buy a property token using **XRP**, and the XRPL automatically converts it through the DEX in a single atomic `Payment` transaction.

### 6. **Crossmark Wallet Integration**
We provide a seamless onboarding experience using the **Crossmark SDK**.
- **Why Crossmark?** We chose Crossmark for its superior developer experience and its status as a browser extension. This ensures a **smooth, friction-less demo** and a professional "Web3-native" feel that doesn't require switching between mobile devices during a trade.
- **How we used it:** Users connect wallets and sign transactions (Trustlines, Offers, Payments) securely without exposing private keys.

### 7. **Decentralized Identifiers (DID)**
To ensure compliance and security in real estate transactions, we incorporate DID.
- **How we used it:** Users can link their DID to their FlowXtate profile, facilitating a decentralized KYC process that respects user privacy.

---

## 🚀 Features

- **Property Marketplace:** Browse and invest in fractionalized real estate.
- **Daily Yields:** Automated dividend distribution directly to investor wallets.
- **Investor Dashboard:** Manage KYC verification and property trustlines.
- **Admin Suite:** Tools for minting property tokens, distributing yields, and processing acquisitions.
- **Real-time Orderbook:** View market depth for every property token on the XRPL DEX.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **XRPL Integration:** `xrpl.js`, `@crossmarkio/sdk`
- **UI Components:** Shadcn UI, Lucide React
- **State Management:** React Context API

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- [Crossmark Wallet Extension](https://crossmark.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/flowxtate.git
   cd flowxtate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Team CSL - University of Indonesia

- **Fahrul:** Lead Developer / XRPL Architect
- **Angga:** Developer
- **Mika:** Developer

---

*FlowXtate: Democratizing Real Estate, One Ledger Entry at a Time.*