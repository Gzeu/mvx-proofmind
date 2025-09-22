# Deploy MVX-ProofMind pe Vercel - MVP

## Da, se poate pune pe Vercel!

Proiectul este complet configurat pentru deployment pe Vercel.

## Quick Deploy

1. **Fork repository-ul**
2. **Du-te pe vercel.com**
3. **Import project din GitHub**
4. **Configureaza env variables:**
   ```
   VITE_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgq...
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   ```
5. **Deploy**

## Structura pentru Vercel

- ✅ `vercel.json` configurat
- ✅ `frontend/` ca root directory
- ✅ Vite build system
- ✅ TypeScript support
- ✅ Environment variables ready

## Environment Variables

În Vercel Dashboard > Settings > Environment Variables:

```
VITE_CONTRACT_ADDRESS=adresa_contractului_tau
VITE_WALLETCONNECT_PROJECT_ID=walletconnect_project_id
```

## Deploy Smart Contract

```bash
cd contract
sc-meta all build

# Deploy DevNet
mxpy contract deploy --bytecode="output/mvx-proofmind.wasm" --keyfile="walletKey.json" --gas-limit=100000000 --proxy="https://devnet-gateway.multiversx.com" --chain="D" --send
```

## Test Local

```bash
cd frontend
npm install
npm run dev
```

## MVP Features

- ✅ Wallet connection
- ✅ Certificate creation
- ✅ Dashboard
- ✅ AI suggestions
- ✅ Mobile responsive

Gata pentru deploy!