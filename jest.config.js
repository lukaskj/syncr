module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  roots: ["./src"],
  testTimeout: 5000,
  collectCoverage: false,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["clover", "lcov", "text", "text-summary", "html"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!**/index.ts",
    "!/dist/",
    "!/node_modules/",
    "!test/**/*",
    "!src/**/__tests__/**",
    "!src/config/*",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
