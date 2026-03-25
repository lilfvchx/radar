# Repository Rules

## Folder Structure
- `client/`: React frontend (Vite, MapLibre GL, Zustand).
- `server/`: Node/Express backend (TypeScript).

## Coding Standards
- Language: TypeScript. Use strict typing.
- Style: Follow existing Prettier/ESLint rules.
- Naming Conventions: Use camelCase for variables/functions, PascalCase for React components and Classes.
- Error Handling: Do not swallow errors. Throw or return typed error objects. Use `try/catch` with detailed logging for external network requests.
- Logging: Use `console.log` / `console.error` with standard prefixes (e.g., `[OSINT]`, `[ArCrime]`).

## Dependency Policy
- Avoid adding heavy dependencies without justification.
- Check bundle size impact on the client side.
- Keep dependencies updated via npm workspaces.
