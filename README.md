# Medसफ़र

A decentralized application for tracking medicines through the supply chain, from raw material suppliers to end consumers.

## Table of Contents
- [Medसफ़र](#medसफ़र)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Local Development Setup](#local-development-setup)
    - [Start Ganache](#start-ganache)
    - [Configure MetaMask](#configure-metamask)
    - [Use Hardhat Test Accounts](#use-hardhat-test-accounts)
    - [Deploy Smart Contracts Locally](#deploy-smart-contracts-locally)
    - [Start the Frontend Application](#start-the-frontend-application)
  - [Sepolia Network Deployment](#sepolia-network-deployment)
    - [Prerequisites](#prerequisites-1)
    - [Configure Environment Variables](#configure-environment-variables)
    - [Steps](#steps)
    - [Start the frontend application:](#start-the-frontend-application-1)
  - [Project Structure](#project-structure)
  - [Features](#features)
  - [Available Scripts](#available-scripts)
    - [Start development server:](#start-development-server)
    - [Compile smart contracts:](#compile-smart-contracts)
    - [Run contract tests:](#run-contract-tests)
    - [Deploy contracts:](#deploy-contracts)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (>= 14.0.0) and **npm** (>= 6.0.0)
- **Git**
- **MetaMask** browser extension
- **Ganache** (for local blockchain simulation)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd medical-supply-chain
   ```

## Local Development Setup


### Start Ganache

Open Ganache and create a new workspace (Quickstart is sufficient).
Note down the RPC Server URL (usually http://127.0.0.1:7545).

### Configure MetaMask

Open MetaMask and add the Ganache network:
- Network Name: Ganache
- RPC URL: http://127.0.0.1:7545
- Chain ID: 1337
- Currency Symbol: ETH

Import test accounts from Ganache into MetaMask using the private keys available in the Ganache interface.

### Use Hardhat Test Accounts

Alternatively, you can use Hardhat's built-in network to run a local blockchain and use its test accounts.

Start the Hardhat node:
```bash
npx hardhat node
```

Configure MetaMask to connect to the Hardhat network:
- Network Name: Hardhat
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

Import test accounts from Hardhat into MetaMask using the private keys displayed in the terminal where you started the Hardhat node.


### Deploy Smart Contracts Locally

Compile and deploy contracts:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address and update the networks configuration in `client/src/constants/SupplyChain.json`:
```json
{
  "5777": {
    "address": "your_deployed_contract_address"
  }
}
```

### Start the Frontend Application

Navigate to the client folder and run:
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

## Sepolia Network Deployment

### Prerequisites

Fund your Sepolia account with ETH from a faucet.

### Configure Environment Variables

Create a .env file in the root directory with the following:
```makefile
SEPOLIA_API_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

### Steps

Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address and update the `SupplyChain.json` file in the client:
```json
{
  "11155111": {
    "address": "your_deployed_contract_address"
  }
}
```

### Start the frontend application:
```bash
cd client
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

## Project Structure
```bash
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── artifacts/      # Contract ABIs and addresses
│   │   ├── components/     # React components
│   │   ├── pages/          # React pages
│   │   └── styles/         # CSS styles
├── contracts/              # Solidity smart contracts
├── scripts/                # Deployment scripts
├── test/                   # Contract tests
└── hardhat.config.js       # Hardhat configuration
```

## Features

- Register supply chain participants: Raw Material Suppliers, Manufacturers, Distributors, Retailers.
- Order medicines: Create and manage orders.
- Track medicine status: Real-time tracking through the supply chain.
- Monitor movement: Detailed logs from supplier to consumer.
- Participant details: View information about all supply chain participants.

## Available Scripts

### Start development server:
```bash
npm run dev
```

### Compile smart contracts:
```bash
npx hardhat compile
```

### Run contract tests:
```bash
npx hardhat test
```

### Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network <network-name>
```