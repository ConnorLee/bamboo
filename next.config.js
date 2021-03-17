module.exports = () => ({
  env: {
    NEXT_PUBLIC_CERAMIC_URL: process.env.CERAMIC_URL || "http://localhost:7007",
    NEXT_PUBLIC_DL_URL: process.env.DL_URL || "http://localhost:3001",
    NEXT_PUBLIC_IPFS_API_URL:
      process.env.IPFS_API_URL || "http://localhost:5011/api/v0",
    NEXT_PUBLIC_IPFS_GATEWAY_URL:
      process.env.IPFS_GATEWAY_URL || "http://localhost:9011/ipfs",
    PDM_SEED: process.env.PDM_SEED,
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
