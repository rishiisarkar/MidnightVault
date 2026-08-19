import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Midnight SDK packages ship as ESM — transpile them for Next.js compatibility
  transpilePackages: [
    "@midnight-ntwrk/compact-js",
    "@midnight-ntwrk/compact-runtime",
    "@midnight-ntwrk/midnight-js",
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
    "@midnight-ntwrk/midnight-js-http-client-proof-provider",
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
    "@midnight-ntwrk/midnight-js-level-private-state-provider",
    "@midnight-ntwrk/dapp-connector-api",
    "@midnight-ntwrk/wallet-api",
    "@midnight-ntwrk/ledger-v8",
    "@midnight-ntwrk/midnight-js-network-id",
    "@midnight-ntwrk/midnight-js-contracts",
    "@midnight-ntwrk/midnight-js-types",
    "@midnight-ntwrk/midnight-js-protocol",
  ],

  // Webpack is required for Midnight WASM / top-level await (see package.json --webpack scripts).
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        leveldown: false,
        level: false,
        "level-js": false,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        ws: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "isomorphic-ws": path.resolve(process.cwd(), "src/lib/ws-shim.js"),
      };
    }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    config.output = {
      ...config.output,
      environment: {
        ...config.output?.environment,
        asyncFunction: true,
      },
    };

    return config;
  },
};

export default nextConfig;
