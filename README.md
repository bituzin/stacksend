# StackSend

A multisend DApp for the Stacks blockchain. Send STX and SIP-010 tokens to multiple recipients in a single transaction.

## Features

- **Multisend STX**: Send STX to up to 50 recipients at once
- **Multisend Tokens**: Send any SIP-010 fungible token to multiple addresses
- **Plan Tiers**: Starter (5), Pro (10), Max (20), Ultra (50) recipients
- **Network Toggle**: Switch between Mainnet and Testnet
- **Bulk Paste**: Paste multiple addresses at once
- **Dark/Light Mode**: Full theme support
- **Clarity 4**: Uses latest Stacks features (`restrict-assets?`, `contract-hash?`)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Wallet**: @stacks/connect v8
- **Smart Contract**: Clarity 4

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Clarinet](https://docs.hiro.so/clarinet) (for smart contract development)
- Stacks wallet (Leather or Xverse)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd stacksend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Contract address after deployment
VITE_CONTRACT_ADDRESS=SPXXXXX.multisend
```

## Smart Contract

The Clarity smart contract is located in `contracts/multisend.clar`.

### Contract Functions

- `send-many-stx`: Batch STX transfers (up to 50 recipients)
- `send-many-ft`: Batch FT transfers (up to 10 recipients per call)
- `get-max-recipients`: Returns max recipients (50)

### Clarity 4 Features Used

- `restrict-assets?`: Limits asset outflows for security
- `contract-hash?`: Verifies FT contracts exist
- `with-stx`: Declares STX transfer limits

### Deploy Contract

```bash
# Check syntax
clarinet check

# Deploy to testnet
clarinet deployments generate --testnet
clarinet deployments apply --testnet

# Deploy to mainnet
clarinet deployments generate --mainnet
clarinet deployments apply --mainnet
```

After deployment, update `VITE_CONTRACT_ADDRESS` in your `.env` file.

## Project Structure

```
stacksend/
├── contracts/              # Clarity smart contracts
│   ├── multisend.clar
│   └── traits/
├── src/
│   ├── components/         # React components
│   │   ├── WalletConnect.tsx
│   │   ├── RecipientTable.tsx
│   │   ├── NetworkToggle.tsx
│   │   ├── PlanSelector.tsx
│   │   └── PasteModal.tsx
│   ├── hooks/
│   │   └── useAuth.ts      # Wallet authentication
│   ├── utils/
│   │   ├── constants.ts    # App configuration
│   │   └── validation.ts   # Address validation
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── logo.png
├── Clarinet.toml
└── package.json
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
clarinet check   # Validate smart contract
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT
