# Sui Groups

A generic, reusable permissioned groups library for Sui. Define custom permission types, manage group membership, and build on-chain access control.

While used by Messaging tooling, Groups is a general-purpose primitive for managing verifiable membership and permissions across applications.

## Key Concept

Groups acts as the source of truth for access control decisions enforced by Messaging tooling and other use cases.

A `PermissionedGroup<T>` is a shared Sui object that holds a list of members and their permissions. The type parameter `T` is a witness from your package, which scopes the group and its permissions to your application.

Your package defines what the permissions mean (e.g. `Editor`, `Viewer`, `FundsManager`). The library handles storing them, enforcing who can grant or revoke them, and emitting events when things change.

See the [Smart Contracts](docs/SmartContracts.md) page for the permission hierarchy, and the [Extending](docs/Extending.md) guide for how to build on top of this.

## Documentation

- [Smart Contracts](docs/SmartContracts.md) — Permission model, actor objects, pause/unpause, events
- [Installation](docs/Installation.md) — npm install, peer dependencies, build from source
- [Setup](docs/Setup.md) — Client extension setup, configuration, sub-modules
- [API Reference](docs/APIRef.md) — Full method reference (imperative, tx, call, view, bcs)
- [Extending](docs/Extending.md) — Write your own Move package, actor objects, Display, TS client
- [Examples](docs/Examples.md) — Common patterns and code snippets
- [Testing](docs/Testing.md) — Unit, integration, and linting

## Features

|  |  |
| --- | --- |
| **Fine-grained permissions** | Grant, revoke, and check arbitrary permission types per member |
| **Actor object pattern** | Objects hold permissions and act on behalf of users (self-service join/leave, custom logic) |
| **Pause/unpause** | Freeze mutations on a group with a recoverable `UnpauseCap`; burn it for permanent archive |
| **Display standard** | Customize how groups render in wallets and explorers |
| **Event-driven** | All mutations emit typed events for indexing and discovery |
| **Composable SDK** | TypeScript client extension per [MystenLabs SDK guidelines](https://sdk.mystenlabs.com/sui/sdk-building) |

## Use Cases

- Encrypted messaging groups (see Sui Stack Messaging)
- DAO governance and voting
- Token-gated communities
- Access control for shared resources
- Role-based collaboration tools

## Package

```
@mysten/sui-groups
```

## Quick Start

```tsx
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { suiGroups } from "@mysten/sui-groups";

const client = new SuiGrpcClient({
  baseUrl: "https://fullnode.testnet.sui.io:443",
  network: "testnet",
}).$extend(
  suiGroups({
    witnessType: "0xYOUR_PKG::my_module::MyWitness",
  }),
);

// Grant a permission
await client.groups.grantPermission({
  signer: keypair,
  groupId: "0x...",
  member: "0xABC...",
  permissionType: "0xYOUR_PKG::my_module::Editor",
});

// Check membership
const isMember = await client.groups.view.isMember({
  groupId: "0x...",
  member: "0xABC...",
});
```