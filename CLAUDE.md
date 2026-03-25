# Claude Model Guidelines for Radar

- Language: Use English for codebase comments/variable names. Provide reports in requested languages (e.g., `es-US`).
- Style: Write concise, functional TypeScript code. Use standard libraries.
- Tooling: Leverage `sqlite3`, `zod`, `express`, `react`, `react-map-gl`, and `zustand`.
- Verification: Always verify your changes. If modifying an endpoint, test the route. If modifying UI, check component rendering.
- Test Run: To run tests, use `npm run test` or `npx vitest run`.
