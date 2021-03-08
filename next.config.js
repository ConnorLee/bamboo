module.exports = () => ({
  env: {
    NEXT_PUBLIC_CERAMIC_URL:
      process.env.NEXT_PUBLIC_CERAMIC_URL || "http://localhost:7007",
    NEXT_PUBLIC_DL_URL:
      process.env.NEXT_PUBLIC_DL_URL || "http://localhost:3001",
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
});
