## Contents

- [Unit Tests + Type Checking](#unit-tests--type-checking)
- [Integration Tests (Localnet)](#integration-tests-localnet)
- [Regenerating Bindings](#regenerating-bindings)
- [Linting](#linting)

# Testing

All commands are run from `ts-sdks/packages/sui-groups/`. See [Setup](Setup.md) for client configuration, or [Examples](Examples.md) for usage patterns to validate against.

## Unit Tests + Type Checking

```bash
pnpm test
```

This runs both:

- `pnpm test:typecheck` -- TypeScript type checking (`tsc -p ./test`)
- `pnpm test:unit` -- Unit tests via Vitest (`vitest run unit`)

## Integration Tests (Localnet)

```bash
pnpm test:integration
```

Runs integration tests against a local Sui node using Docker (via `testcontainers`). The test harness:

1. Starts a local Sui node container
2. Deploys the `sui-groups` and `example-group` Move packages
3. Runs test flows (permission management, membership, views, pause/unpause)
4. Tears down the container

No manual setup required, **but Docker must be running**.

## Regenerating Bindings

After modifying Move contracts:

```bash
pnpm codegen
```

This runs:

1. `sui move summary` on the `sui-groups` Move package
2. `sui-ts-codegen generate` to regenerate TypeScript bindings
3. `pnpm lint:fix` to format the generated code

See [Smart Contracts](SmartContracts.md) for an overview of the on-chain package.

## Linting

```bash
pnpm lint          # Check (oxlint + prettier)
pnpm lint:fix      # Auto-fix
```

---

[Back to top](#contents) | [Installation](Installation.md) | [Smart Contracts](SmartContracts.md) | [Setup](Setup.md) | [Extending](Extending.md) | [API Reference](APIRef.md) | [Examples](Examples.md)
