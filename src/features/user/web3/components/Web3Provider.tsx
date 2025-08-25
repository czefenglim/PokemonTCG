// 'use client';

// import '@rainbow-me/rainbowkit/styles.css';
// import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
// import { WagmiProvider } from 'wagmi';
// import { localhost } from 'wagmi/chains';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { sepolia } from 'wagmi/chains'; // if using wagmi

// // 🎯 HARDHAT-ONLY CONFIGURATION
// const sepoliaChain = {
//   id: 11155111,
//   name: 'Sepolia',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ether',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     default: {
//       http: [process.env.RPC_URL],
//     },
//     public: {
//       http: [process.env.RPC_URL],
//     },
//   },
//   blockExplorers: {
//     default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
//   },
// };

// const chains = [sepoliaChain]; // 👈 Only Sepolia network now!

// const wagmiConfig = getDefaultConfig({
//   appName: 'Pokemon TCG',
//   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo', // 👈 Added fallback
//   chains: [sepolia],
//   ssr: true,
// });

// const queryClient = new QueryClient();

// export default function Web3Provider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <WagmiProvider config={wagmiConfig}>
//       {' '}
//       {/* 👈 Updated from WagmiConfig */}
//       <QueryClientProvider client={queryClient}>
//         <RainbowKitProvider
//           appInfo={{
//             appName: 'Pokemon TCG',
//           }}
//         >
//           {children}
//         </RainbowKitProvider>
//       </QueryClientProvider>
//     </WagmiProvider>
//   );
// }

'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { localhost, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 🛠 Custom Hardhat chain (localhost:8545 with id 31337)
const hardhatChain = {
  ...localhost,
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://127.0.0.1:8545' },
  },
};

// ✅ Use both Sepolia and Hardhat
const chains = [sepolia, hardhatChain];

const wagmiConfig = getDefaultConfig({
  appName: 'Pokemon TCG',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo', // 👈 Added fallback
  chains: [sepolia], // or [sepolia, hardhat]
  ssr: true,
  autoConnect: true, // 👈 enables automatic reconnect after reload
});

const queryClient = new QueryClient();

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {' '}
      {/* 👈 Updated from WagmiConfig */}
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: 'Pokemon TCG',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
