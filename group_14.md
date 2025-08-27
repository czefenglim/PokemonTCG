# 🎮 PokeChain – A Pokémon TCG Blockchain Game

PokeChain is a decentralized application (DApp) that brings the Pokémon Trading Card Game (TCG) to the blockchain. Developed for the CT124-3-3-BCD Group Assignment, this project demonstrates a secure and transparent card ownership and battle system using smart contracts on a local blockchain network.

---

## 1️⃣ System Setup Instructions

### 🔧 Prerequisites

- Node.js (v16+ recommended)
- Hardhat (blockchain development environment)
- MySQL or PostgreSQL (optional for storing metadata)
- Stripe CLI (for payment webhook simulation)
- Git

### 📦 Installation Steps

```bash
# Clone the repository
git clone https://github.com/your-repo/pokechain.git
cd pokechain

# Install all dependencies
npm install
```

### 🧪 Running the Hardhat Local Blockchain

```bash
# Start a local blockchain node
npx hardhat node
```

### 🚀 Deploy Smart Contracts

```bash
# In a new terminal window
npx hardhat run scripts/deploy.js --network localhost
```

### 💻 Start the Frontend Application

```bash
# Run the Next.js development server
npm run dev
```

### 💳 Stripe CLI Setup

1. Download Stripe CLI from [The Stripe Docs logo](https://stripe.com/docs/stripe-cli)

2. Authenticate using your Stripe account:
   
   ```bash
   stripe login
   ```

3. Start listening for webhooks:
   
   ```bash
   D:\stripe.exe listen --forward-to localhost:3000/api/webhook
   ```

> The app will usually run on `http://localhost:3000`

---

## 2️⃣ System Features

- 🃏 **Mint Pokémon Cards**
  
  - Players can mint Pokémon cards as NFTs (Non-Fungible Tokens).

- 🤝 **Trade & Own Cards**
  
  - Every card is a unique token stored on the blockchain and owned by players via their wallet address.

- ⚔️ **Battle Mode (Prototype)**
  
  - Simulate card battles using on-chain logic or smart contract rules.

- 🔐 **Blockchain-based Authentication**
  
  - Users connect via MetaMask and are identified by their wallet address.

- 💳 **Stripe Payment Integration**
  
  - Payments for premium packs or services handled via Stripe API.

- 📚 **Card Metadata**
  
  - Optional local database stores card details, stats, and history.

- 💼 **Admin Functions**
  
  - Admins can add new card types and control card distribution via the dashboard.

---

## 3️⃣ Workload Matrix

🏆 **GAN MING HUI** - *Project Leader*

**Student ID:** TP065539

**📊 Complete Task List (Click to expand)**

1. Set up **Next.js** frontend framework
2. Set up **MySQL** database
3. Developed **landing page**
4. Developed **login page**
5. Developed **register page** with **bcrypt hashing** for passwords
6. Designed the **browser icon (favicon)**
7. Found and integrated the **official Pokémon API**
8. Developed the **user homepage**
9. Implemented **change avatar** functionality
10. Created the **sidebar navigation**
11. Developed **open pack** feature and integrated it with the smart contract to mint NFTs using **ERC-1155**
12. Created the **collection page** to view owned cards
13. Implemented **buy gems** feature using **Stripe payment gateway**
14. Integrated **MetaMask** wallet connection
15. Developed the **admin dashboard**
16. Created the **admin gem package management** feature
17. Designed **Hall of Fame** page (UI/UX)
18. Designed **Merchandise** page (UI/UX)

**Contribution:** **%**

---

### 👨‍💻 **CHEN YU RUI**

**Student ID:** TP073652

**Key Responsibilities:**

- *[To be filled by team member]*

**Contribution:** **10%**

---

### 👨‍💻 **LIM CZE FENG**

**Student ID:** TP073864

**Key Responsibilities:**

- *[To be filled by team member]*

**Contribution:** *35*%

---

### 👨‍💻 **LIM ZHI XIANG**

**Student ID:** TP066076

**Key Responsibilities:**

- *[To be filled by team member]*

**Contribution:** **%

---

## 📌 Notes

- Ensure MetaMask is installed and connected to your local Hardhat network.
- Stripe CLI must be running for payment features to work.
- Run `npm install` before starting the project.

---
