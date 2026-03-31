## Contents

- [Install from npm](#install-from-npm)
- [Build from source](#build-from-source)
- [Requirements](#requirements)
- [Smart Contract](#smart-contract)

# Installation

## Install from npm

```bash
pnpm add @mysten/sui-groups
```

Peer dependencies:

```bash
pnpm add @mysten/sui @mysten/bcs
```

## Build from source

```bash
git clone https://github.com/MystenLabs/sui-groups
cd ts-sdks
pnpm install
pnpm build
```

## Requirements

- Node.js >= 22
- pnpm >= 10.17.0

## Smart Contract

The `sui_groups` Move package is pre-deployed on **testnet** and **mainnet**. The SDK auto-detects the correct package IDs based on the client's network.

For localnet or custom deployments, provide a `packageConfig`:

```typescript
suiGroups({
  witnessType: '0xYOUR_PKG::module::Witness',
  packageConfig: {
    originalPackageId: '0x...',
    latestPackageId: '0x...',
  },
});
```

See [Setup](Setup.md) for details. For an overview of the on-chain package, see [Smart Contracts](SmartContracts.md).

---

[Back to top](#contents)
