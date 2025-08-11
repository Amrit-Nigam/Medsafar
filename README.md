# Medsafar (मेडसफर)

> **Smart India Hackathon (SIH) 2024 Finalist Project**

A decentralized blockchain application for tracking medicines through the entire supply chain - from raw material suppliers to end consumers. Built with Solidity smart contracts and React frontend to ensure transparency, authenticity, and traceability in pharmaceutical distribution.

**Developed as part of [Smart India Hackathon 2024](https://kjsce.somaiya.edu/en/view-announcement/672/) - representing innovation in healthcare technology solutions.**

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Local Development Setup](#local-development-setup)
  - [Option 1: Using Ganache](#option-1-using-ganache)
  - [Option 2: Using Hardhat Network](#option-2-using-hardhat-network)
- [Sepolia Testnet Deployment](#sepolia-testnet-deployment)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Testing](#testing)
- [Available Scripts](#available-scripts)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

## Features

- **End-to-End Tracking**: Monitor medicines from raw materials to final delivery
- **Multi-Role System**: Support for suppliers, manufacturers, distributors, and retailers  
- **Order Management**: Create, track, and manage medicine orders seamlessly
- **Real-Time Monitoring**: Live status updates throughout the supply chain
- **Detailed Logging**: Comprehensive audit trail for all transactions
- **Blockchain Security**: Immutable records powered by Ethereum
- **Decentralized**: No single point of failure or control

## Architecture

```
Raw Material → Manufacturer → Distributor → Retailer → Consumer
     ↓              ↓            ↓           ↓          ↓
  Blockchain ←→ Smart Contract ←→ Frontend ←→ MetaMask
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (>= 14.0.0) and **npm** (>= 6.0.0)
- **Git**
- **MetaMask** browser extension
- **Ganache** (for local blockchain simulation) or **Hardhat Network**

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Amrit-Nigam/Medsafar.git
cd Medsafar
```

### 2. Install Dependencies
```bash
npm install
cd client
npm install
cd ..
```

## Local Development Setup

### Option 1: Using Ganache

1. **Start Ganache**
   - Open Ganache and create a new workspace (Quickstart is sufficient)
   - Note the RPC Server URL (usually `http://127.0.0.1:7545`)

2. **Configure MetaMask**
   - Add Ganache network to MetaMask:
     - Network Name: `Ganache`
     - RPC URL: `http://127.0.0.1:7545`
     - Chain ID: `1337`
     - Currency Symbol: `ETH`
   - Import test accounts using private keys from Ganache

### Option 2: Using Hardhat Network

1. **Start Hardhat Node**
   ```bash
   npx hardhat node
   ```

2. **Configure MetaMask**
   - Add Hardhat network:
     - Network Name: `Hardhat`
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `31337`
     - Currency Symbol: `ETH`
   - Import test accounts using private keys displayed in terminal

### 3. Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Update Contract Address

Copy the deployed contract address and update `client/src/constants/SupplyChain.json`:

```json
{
  "5777": {
    "address": "your_deployed_contract_address"
  }
}
```

### 5. Start Frontend

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:3000`

## Sepolia Testnet Deployment

### 1. Setup Environment

Create a `.env` file in the root directory:

```env
SEPOLIA_API_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

### 2. Fund Your Account

Get Sepolia ETH from a faucet like:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

### 3. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 4. Update Contract Configuration

Update `client/src/constants/SupplyChain.json` with Sepolia network:

```json
{
  "11155111": {
    "address": "your_deployed_contract_address"
  }
}
```

## Project Structure

```
Medsafar/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── artifacts/      # Contract ABIs and addresses
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Application pages
│   │   └── styles/        # CSS styling
├── contracts/             # Solidity smart contracts
├── scripts/              # Deployment and utility scripts
├── test/                 # Smart contract tests
├── hardhat.config.js     # Hardhat configuration
└── package.json          # Project dependencies
```

## Usage

### For Supply Chain Participants

1. **Registration**: Register as a supplier, manufacturer, distributor, or retailer
2. **Create Orders**: Initiate medicine orders with detailed specifications
3. **Track Progress**: Monitor order status in real-time
4. **Update Status**: Update order status as it moves through the supply chain
5. **View History**: Access complete audit trail for any medicine batch

### For Consumers

1. **Verify Authenticity**: Check if medicines are genuine
2. **Track Origin**: See the complete journey from raw materials
3. **View Details**: Access information about all participants in the chain

## Testing

Run smart contract tests:

```bash
npx hardhat test
```

## Available Scripts

```bash
# Frontend development
npm run dev                    # Start development server

# Smart contract operations
npx hardhat compile           # Compile contracts
npx hardhat test             # Run tests
npx hardhat run scripts/deploy.js --network <network>  # Deploy contracts
npx hardhat node            # Start local blockchain
```

## Configuration

### Network Configuration

The project supports multiple networks configured in `hardhat.config.js`:

- **Localhost**: For local development
- **Sepolia**: For testnet deployment
- **Mainnet**: For production (configure with caution)

### MetaMask Networks

Ensure MetaMask is configured with the appropriate network settings matching your deployment target.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Troubleshooting

### Common Issues

- **Contract not found**: Ensure you've updated the contract address in `SupplyChain.json`
- **MetaMask connection issues**: Verify network configuration and account import
- **Transaction failures**: Check if you have sufficient ETH for gas fees
- **Build errors**: Clear `node_modules` and reinstall dependencies

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify MetaMask is connected to the correct network
3. Ensure contract is deployed and address is updated
4. Check that you have sufficient test ETH

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Smart India Hackathon 2024**: This project was developed as part of SIH 2024, where it reached the finalist stage
- Built with [Hardhat](https://hardhat.org/) development environment
- Frontend powered by [React](https://reactjs.org/)
- Blockchain integration via [Web3.js](https://web3js.readthedocs.io/)
- UI components and styling
- Special thanks to the SIH organizing committee and mentors for their support


---

**Made with ❤️ Team SilkRoad**