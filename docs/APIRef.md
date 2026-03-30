## Contents

- [What the TS SDK Does Not Expose](#what-the-ts-sdk-does-not-expose)
- [Imperative Methods](#imperative-methods)
  - [grantPermission](#grantpermission)
  - [grantPermissions](#grantpermissions)
  - [revokePermission](#revokepermission)
  - [revokePermissions](#revokepermissions)
  - [addMembers](#addmembers)
  - [removeMember](#removemember)
  - [pause](#pause)
  - [unpause](#unpause)
- [View Methods](#view-methods)
  - [hasPermission](#haspermission)
  - [isMember](#ismember)
  - [isPaused](#ispaused)
  - [getMembers](#getmembers)
- [Transaction Builders (tx.*)](#transaction-builders-tx)
- [Call Builders (call.*)](#call-builders-call)
- [BCS Parsing (bcs.*)](#bcs-parsing-bcs)

# SDK API Reference

All methods are accessed through `client.groups` after extending the client with `suiGroups()`. See [Setup](Setup.md) for how to configure the client extension.

Groups APIs focus on membership governance: creating groups, managing permissions, and enforcing access control used by higher-level tooling like Messaging.

## What the TS SDK Does Not Expose

Some Move-level operations are intentionally **not exposed** in the TS SDK because they require extending-package-specific arguments:

### Group Creation (`new` / `new_derived`)

These Move functions require the extending package's witness type as an argument. The extending contract should expose its own wrapper function for group creation (choosing `new`, `new_derived`, or both based on its needs), and the extending TS SDK should call that wrapper via `moveCall`. See [Extending](Extending.md).

### Actor Object Operations (`object_grant_permission`, `object_revoke_permission`, `object_remove_member`)

These Move functions require the actor's `&UID`, which should not be publicly accessible. The extending Move contract should define wrapper functions (e.g., `join()`, `leave()`) that internally access `&actor.id` and call the `object_*` functions. The extending TS SDK then calls those wrappers via `moveCall`.

Exposing the actor's UID would undermine the security guarantee of the [actor object pattern](SmartContracts.md#actor-object-pattern) -- the whole point is that only the defining contract can invoke these operations through its custom logic.

See [Extending](Extending.md) for full Move + TS walkthrough of both patterns.

---

## Imperative Methods

These methods build, sign, and execute transactions in a single call. All require a `signer`.

---

### grantPermission

**Signature:** `grantPermission(options: GrantPermissionOptions): Promise<{ digest, effects }>`

Grants a permission to a member. If the member doesn't exist, they are automatically added to the group.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `member` | `string \| TransactionArgument` | Address of the member |
| `permissionType` | `string` | Full Move type path (e.g., `'0xpkg::mod::Editor'`) |

---

### grantPermissions

**Signature:** `grantPermissions(options: GrantPermissionsOptions): Promise<{ digest, effects }>`

Grants multiple permissions to a member in a single transaction.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `member` | `string \| TransactionArgument` | Address of the member |
| `permissionTypes` | `string[]` | Permission types to grant |

---

### revokePermission

**Signature:** `revokePermission(options: RevokePermissionOptions): Promise<{ digest, effects }>`

Revokes a permission from a member. If this is the member's last permission, they are automatically removed from the group.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `member` | `string \| TransactionArgument` | Address of the member |
| `permissionType` | `string` | Permission type to revoke |

---

### revokePermissions

**Signature:** `revokePermissions(options: RevokePermissionsOptions): Promise<{ digest, effects }>`

Revokes multiple permissions from a member in a single transaction.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `member` | `string \| TransactionArgument` | Address of the member |
| `permissionTypes` | `string[]` | Permission types to revoke |

---

### addMembers

**Signature:** `addMembers(options: AddMembersOptions): Promise<{ digest, effects }>`

Adds multiple members to a group, each with their own set of permissions. Members who already exist receive the additional permissions.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `members` | `MemberWithPermissions[]` | Array of `{ address: string, permissions: string[] }` |

---

### removeMember

**Signature:** `removeMember(options: RemoveMemberOptions): Promise<{ digest, effects }>`

Removes a member from the group. Requires `PermissionsAdmin` permission.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `member` | `string \| TransactionArgument` | Address to remove |

---

### pause

**Signature:** `pause(options: PauseOptions): Promise<{ digest, effects }>`

Pauses the group, preventing all mutations. Returns and transfers the `UnpauseCap` to the given recipient (defaults to the signer's address). See [Smart Contracts -- Pause / Unpause](SmartContracts.md#pause--unpause) for the archive pattern.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer (must have `PermissionsAdmin`) |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `unpauseCapRecipient?` | `string` | Address to receive the `UnpauseCap` (defaults to signer) |

---

### unpause

**Signature:** `unpause(options: UnpauseOptions): Promise<{ digest, effects }>`

Unpauses the group. Consumes and destroys the `UnpauseCap`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `Signer` | Transaction signer (must own the `UnpauseCap`) |
| `groupId` | `string \| TransactionArgument` | PermissionedGroup object ID |
| `unpauseCapId` | `string \| TransactionArgument` | The `UnpauseCap` object ID |

---

## View Methods

Read-only queries. No signer or gas required.

### hasPermission

**Signature:** `view.hasPermission(options: HasPermissionViewOptions): Promise<boolean>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | PermissionedGroup object ID |
| `member` | `string` | Address to check |
| `permissionType` | `string` | Permission type to check |

---

### isMember

**Signature:** `view.isMember(options: IsMemberViewOptions): Promise<boolean>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | PermissionedGroup object ID |
| `member` | `string` | Address to check |

---

### isPaused

**Signature:** `view.isPaused(options: IsPausedViewOptions): Promise<boolean>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | PermissionedGroup object ID |

---

### getMembers

**Signature:** `view.getMembers(options: GetMembersViewOptions): Promise<GetMembersResponse>`

Returns group members with their permissions. Supports pagination or exhaustive fetch.

**Paginated:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | PermissionedGroup object ID |
| `cursor?` | `string \| null` | Pagination cursor |
| `limit?` | `number` | Max members per page |

**Exhaustive:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | PermissionedGroup object ID |
| `exhaustive` | `true` | Fetch all members across all pages |

**Returns:**

```typescript
{
  members: MemberWithPermissions[];  // { address, permissions }
  hasNextPage: boolean;
  cursor: string | null;
}
```

---

## Transaction Builders (`tx.*`)

Return `Transaction` objects ready for signing. Same parameters as imperative methods (minus `signer`).

```typescript
const tx = client.groups.tx.grantPermission({
  groupId: '0x...',
  member: '0xABC...',
  permissionType: '0xpkg::mod::Editor',
});

const result = await keypair.signAndExecuteTransaction({ transaction: tx, client });
```

Available: `grantPermission`, `grantPermissions`, `revokePermission`, `revokePermissions`, `addMembers`, `removeMember`, `pause`, `unpause`.

---

## Call Builders (`call.*`)

Return [transaction thunks](https://sdk.mystenlabs.com/sui/sdk-building#transaction-thunks) for composing multiple operations into a single PTB via `tx.add()`.

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();
tx.add(client.groups.call.grantPermission({ groupId, member, permissionType: typeA }));
tx.add(client.groups.call.grantPermission({ groupId, member, permissionType: typeB }));
await keypair.signAndExecuteTransaction({ transaction: tx, client });
```

Available: same as `tx.*`, plus `delete` (which returns `(PermissionsTable, u64, address)` that needs handling in a PTB).

See [Examples -- Composing Transaction Thunks](Examples.md#composing-transaction-thunks) for more.

---

## BCS Parsing (`bcs.*`)

BCS type definitions for parsing on-chain data:

- `bcs.PermissionedGroup` -- the main group struct
- `bcs.GroupCreated`, `bcs.GroupDerived(derivationKeyType)`, `bcs.GroupDeleted`
- `bcs.GroupPaused`, `bcs.GroupUnpaused`
- `bcs.MemberAdded`, `bcs.MemberRemoved`
- `bcs.PermissionsGranted`, `bcs.PermissionsRevoked`
- `bcs.PausedMarker`
- `bcs.PermissionsAdmin`, `bcs.ExtensionPermissionsAdmin`, `bcs.ObjectAdmin`, `bcs.GroupDeleter`

---

[Back to top](#contents) | [Installation](Installation.md) | [Smart Contracts](SmartContracts.md) | [Setup](Setup.md) | [Extending](Extending.md) | [Examples](Examples.md) | [Testing](Testing.md)
