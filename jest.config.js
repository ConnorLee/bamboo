module.exports = {
  preset: "ts-jest",
  testTimeout: 10000,
  testEnvironment: "jest-environment-uint8array",
  globals: {
    // must match server secret
    JWT_SECRET: "fhdsajfhbdjlsafhdsjkafhdsjkla",
  },
};
