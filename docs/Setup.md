## Contents

- [Client Extension Setup](#client-extension-setup)
- [Configuration](#configuration)
  - [witnessType (required)](#witnesstype-required)
  - [packageConfig (optional)](#packageconfig-optional)
  - [name (optional)](#name-optional)
- [Sub-Modules](#sub-modules)
  - [When to use which](#when-to-use-which)

# Developer Setup

This SDK follows the [MystenLabs TS SDK building guidelines](https://sdk.mystenlabs.com/sui/sdk-building). It uses the **client extension pattern** -- you extend a base Sui client with the `suiGroups()` extension function.

## Client Extension Setup

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suiGroups } from '@mysten/sui-groups';

const client = new SuiGrpcClient({
  baseUrl: 'https://fullnode.testnet.sui.io:443',
  network: 'testnet',
}).$extend(
  suiGroups({
    witnessType: '0xYOUR_PKG::my_module::MyWitness',
  }),
);
```

After extending, the `client.groups` namespace is available with all SDK methods. See [API Reference](APIRef.md) for the full method list.

## Configuration

### `witnessType` (required)

The full Move type path of the witness struct from your extending package:

```
0xPACKAGE_ID::module_name::WitnessType
```

This must be a struct with `drop` ability defined in your Move package. It scopes all permissions and events to your application. See [Smart Contracts](SmartContracts.md) for how the witness type is used on-chain.

Example: if your Move package at `0xabc123...` has `module my_app` with `public struct MyWitness() has drop;`, the witness type is:

```
0xabc123...::my_app::MyWitness
```

### `packageConfig` (optional)

For testnet and mainnet, the SDK auto-detects package IDs. For localnet or custom deployments:

```typescript
suiGroups({
  witnessType: '...',
  packageConfig: {
    originalPackageId: '0x...', // V1 package ID (used for type names, BCS)
    latestPackageId: '0x...',   // Current package ID (used for moveCall targets)
  },
});
```

After a package upgrade, `originalPackageId` stays the same (Move's `type_name::with_original_ids()` always uses V1), while `latestPackageId` points to the upgraded version.

### `name` (optional)

The extension registers under `'groups'` by default. Override if composing with other extensions that might conflict:

```typescript
suiGroups({ name: 'permissions', witnessType: '...' });
// Access: client.permissions.grantPermission(...)
```

## Sub-Modules

The `client.groups` object exposes four sub-modules:

| Sub-module | Purpose | Example |
|------------|---------|---------|
| `call` | PTB thunks -- composable transaction steps | `client.groups.call.grantPermission(opts)(tx)` |
| `tx` | Full transactions -- ready to sign | `client.groups.tx.grantPermission(opts)` |
| `view` | Read-only queries (no gas) | `client.groups.view.isMember(opts)` |
| `bcs` | BCS type definitions for parsing | `client.groups.bcs.PermissionedGroup` |

### When to use which

- **Top-level imperative methods** (e.g., `client.groups.grantPermission()`): simplest -- sign and execute in one call.
- **`tx.*`**: when you need a `Transaction` object to inspect or modify before signing.
- **`call.*`**: when composing multiple operations into a single PTB (Programmable Transaction Block). See [Examples](Examples.md#composing-transaction-thunks).
- **`view.*`**: for read-only queries that don't require a signer.

---

[Back to top](#contents)
