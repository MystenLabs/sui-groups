## Contents

- [Managing Members and Permissions](#managing-members-and-permissions)
- [Batch Operations](#batch-operations)
- [Querying Members](#querying-members)
- [Composing Transaction Thunks](#composing-transaction-thunks)

# Examples

For the full method reference, see [API Reference](APIRef.md). For how to build your own extension on top of the groups SDK, see [Extending](Extending.md).

## Managing Members and Permissions

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suiGroups } from '@mysten/sui-groups';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const adminKeypair = Ed25519Keypair.generate();

const client = new SuiGrpcClient({
  baseUrl: 'https://fullnode.testnet.sui.io:443',
  network: 'testnet',
}).$extend(
  suiGroups({
    witnessType: '0xYOUR_PKG::my_app::MyWitness',
  }),
);

const groupId = '0x...'; // An existing PermissionedGroup<MyWitness>
const memberAddress = '0xABC...';

// Grant a permission (automatically adds the member if new)
await client.groups.grantPermission({
  signer: adminKeypair,
  groupId,
  member: memberAddress,
  permissionType: '0xYOUR_PKG::my_app::Editor',
});

// Check the permission was granted
const hasEditor = await client.groups.view.hasPermission({
  groupId,
  member: memberAddress,
  permissionType: '0xYOUR_PKG::my_app::Editor',
});
console.log(`Has Editor: ${hasEditor}`); // true

// Revoke the permission (removes the member if it was their last)
await client.groups.revokePermission({
  signer: adminKeypair,
  groupId,
  member: memberAddress,
  permissionType: '0xYOUR_PKG::my_app::Editor',
});
```

## Batch Operations

Add multiple members with different permissions in a single transaction:

```typescript
await client.groups.addMembers({
  signer: adminKeypair,
  groupId,
  members: [
    {
      address: '0xALICE...',
      permissions: [
        '0xYOUR_PKG::my_app::Editor',
        '0xYOUR_PKG::my_app::Viewer',
      ],
    },
    {
      address: '0xBOB...',
      permissions: [
        '0xYOUR_PKG::my_app::Viewer',
      ],
    },
  ],
});
```

## Querying Members

```typescript
// Check if an address is a member
const isMember = await client.groups.view.isMember({
  groupId,
  member: '0xALICE...',
});

// Get all members with their permissions
const { members } = await client.groups.view.getMembers({
  groupId,
  exhaustive: true,
});

for (const member of members) {
  console.log(`${member.address}: ${member.permissions.join(', ')}`);
}

// Paginated fetch
const page = await client.groups.view.getMembers({
  groupId,
  limit: 10,
});
console.log(`Page has ${page.members.length} members, more: ${page.hasNextPage}`);
```

## Composing Transaction Thunks

Use call builders with `tx.add()` to compose multiple operations into a single transaction. This follows the [MystenLabs SDK transaction thunks pattern](https://sdk.mystenlabs.com/sui/sdk-building#transaction-thunks):

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();

// Compose multiple thunks into one transaction
tx.add(client.groups.call.grantPermission({
  groupId,
  member: '0xALICE...',
  permissionType: '0xYOUR_PKG::my_app::Editor',
}));

tx.add(client.groups.call.grantPermission({
  groupId,
  member: '0xALICE...',
  permissionType: '0xYOUR_PKG::my_app::Reviewer',
}));

await adminKeypair.signAndExecuteTransaction({ transaction: tx, client });
```

For more on the `call.*` vs `tx.*` distinction, see [Setup -- Sub-Modules](Setup.md#sub-modules).

---

[Back to top](#contents)
