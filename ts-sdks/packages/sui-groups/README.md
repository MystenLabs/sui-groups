# @mysten/sui-groups

TypeScript SDK for permissioned groups on Sui. Create and manage groups with fine-grained, on-chain
permissions using the [sui_groups](https://github.com/MystenLabs/sui-groups) Move package.

## Installation

```bash
npm install @mysten/sui-groups
```

Peer dependencies: `@mysten/sui`, `@mysten/bcs`

## Quick Start

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suiGroups } from '@mysten/sui-groups';

// Create a Sui client extended with groups
const client = new SuiGrpcClient({ network: 'testnet' }).$extend(
	suiGroups({
		// The witness type from your extending Move package
		witnessType: '0xYOUR_PACKAGE::module::WITNESS',
	}),
);

// Add members with permissions
await client.groups.addMembers({
	signer,
	groupId: '0x...',
	members: [
		{
			address: '0xalice...',
			permissions: ['0xYOUR_PACKAGE::module::Reader', '0xYOUR_PACKAGE::module::Writer'],
		},
		{ address: '0xbob...', permissions: ['0xYOUR_PACKAGE::module::Reader'] },
	],
});

// Grant / revoke permissions
await client.groups.grantPermission({
	signer,
	groupId: '0x...',
	member: '0xalice...',
	permissionType: '0xYOUR_PACKAGE::module::Admin',
});
await client.groups.revokePermission({
	signer,
	groupId: '0x...',
	member: '0xbob...',
	permissionType: '0xYOUR_PACKAGE::module::Writer',
});

// Remove a member
await client.groups.removeMember({ signer, groupId: '0x...', member: '0xbob...' });

// Pause / unpause a group
await client.groups.pause({ signer, groupId: '0x...' });
await client.groups.unpause({ signer, groupId: '0x...', unpauseCapId: '0x...' });
```

## Client Extension Pattern

The SDK uses Sui's client extension system. Call `$extend(suiGroups(...))` on any Sui client
(`SuiGrpcClient`, `SuiGraphQLClient`, etc.) to add the `.groups` property:

```ts
const client = suiClient.$extend(
	suiGroups({
		witnessType: '0xYOUR_PACKAGE::module::WITNESS',
		// Optional: override package config for localnet/devnet
		packageConfig: { originalPackageId: '0x...', latestPackageId: '0x...' },
	}),
);

client.groups; // SuiGroupsClient instance
client.groups.tx; // Transaction builders (returns Transaction, doesn't execute)
client.groups.call; // Low-level Move call builders
client.groups.view; // Read-only queries
client.groups.bcs; // BCS parsing utilities
```

## API

### Top-Level Methods

These sign, execute, and wait for the transaction:

| Method                | Description                                         |
| --------------------- | --------------------------------------------------- |
| `addMembers()`        | Add members with permissions (idempotent)           |
| `grantPermission()`   | Grant a permission (adds the member if they're new) |
| `grantPermissions()`  | Grant multiple permissions in one transaction       |
| `revokePermission()`  | Revoke a permission (removes member if last one)    |
| `revokePermissions()` | Revoke multiple permissions in one transaction      |
| `removeMember()`      | Remove a member entirely                            |
| `pause()`             | Pause the group, receive an `UnpauseCap`            |
| `unpause()`           | Unpause the group by consuming the `UnpauseCap`     |

### Transaction Builders (`client.groups.tx`)

Same methods as above, but return a `Transaction` object without executing. Useful for composing
with other transactions.

## License

Apache-2.0
