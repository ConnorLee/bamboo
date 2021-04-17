module.exports = () => ({
  env: {
    NEXT_PUBLIC_ETH_RPC_URL:
      process.env.ETH_RPC_URL || "https://bsc-dataseed.binance.org/",
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  images: {
    domains: ["localhost"],
  },
});
