## Contents

- [PermissionedGroup\<T\>](#permissionedgroupt)
- [Membership Model](#membership-model)
- [Permission Hierarchy](#permission-hierarchy)
  - [Core Permissions](#core-permissions-defined-in-sui_groups-package)
  - [Extension Permissions](#extension-permissions-defined-in-your-package)
- [Actor Object Pattern](#actor-object-pattern)
- [Pause / Unpause](#pause--unpause)
- [Group Creation](#group-creation)
- [Delete](#delete)
- [Events](#events)
- [Display Standard](#display-standard)

# Smart Contracts

Overview of the `sui_groups` Move package. For the auto-generated contract documentation, see [move/design_docs/sui_groups/](../../move/design_docs/sui_groups/).

## PermissionedGroup\<T\>

The core struct, parameterized by a witness type `T`:

```move
public struct PermissionedGroup<phantom T: drop> has key, store {
    id: UID,
    permissions: PermissionsTable,
    permissions_admin_count: u64,
    creator: address,
}
```

- `T` scopes the group to your application package
- `permissions` is a derived object (`PermissionsTable`) that maps addresses to their permission sets
- At least one `PermissionsAdmin` must always exist (enforced invariant)

## Membership Model

Membership is defined by permissions: a member exists if and only if they have at least one permission.

- `grant_permission()` automatically adds a member if they don't exist
- Revoking the last permission automatically removes the member
- There is no separate "add member" operation -- granting any permission implicitly adds them

## Permission Hierarchy

### Core Permissions (defined in `sui_groups` package)

| Permission | Can Manage | Purpose |
|-----------|------------|---------|
| `PermissionsAdmin` | Core permissions (PermissionsAdmin, ExtensionPermissionsAdmin, ObjectAdmin, GroupDeleter) | Top-level admin. Can remove members. |
| `ExtensionPermissionsAdmin` | Extension permissions (from other packages) | Manages app-specific permissions without access to core permissions. |
| `ObjectAdmin` | N/A | Grants `&UID` / `&mut UID` access via the actor object pattern. Used for attaching dynamic fields or integrating with external protocols (e.g., SuiNS reverse lookup). |
| `GroupDeleter` | N/A | Allows destroying the group via `delete()`. |

### Extension Permissions (defined in your package)

Your package defines its own permission types (e.g., `Editor`, `Viewer`). These are managed by `ExtensionPermissionsAdmin`, not `PermissionsAdmin`.

This separation ensures that:
- `PermissionsAdmin` cannot accidentally grant your app-specific permissions
- `ExtensionPermissionsAdmin` cannot escalate to core admin permissions

## Actor Object Pattern

The actor object pattern enables **third-party contracts to implement custom logic** over the base group membership operations. Rather than relying on an admin to directly grant/revoke permissions, an extending contract can define its own rules for when and how permissions change.

### How it works

An actor object is a Sui object (with a `UID`) that:
1. Has the necessary permissions granted to its **object address** (not a user address)
2. Lives inside an extending Move contract that defines wrapper functions around `object_grant_permission` / `object_revoke_permission` / `object_remove_member`

When the extending contract calls `object_grant_permission(&actor.id, recipient)`, the group verifies that the actor's UID address has the required permissions. Because `&UID` can only be obtained from within the Move module that defines the actor object, **only the extending contract can invoke these operations** -- external callers cannot bypass the custom logic.

### What this enables

- **Custom join rules**: a `PaidJoinRule` actor that grants membership only after the user pays a fee
- **Self-service leave**: a `GroupLeaver` actor that lets any member remove themselves without admin intervention
- **NFT-gated access**: an actor that checks NFT ownership before granting permissions
- **UID access**: `object_uid` / `object_uid_mut` provide raw `&UID` / `&mut UID` access to the group, enabling dynamic fields, SuiNS integration, or any protocol that needs the group's UID

### Security guarantee

The UID-based verification is what makes this safe: only the contract that defines the actor struct and its public functions can access the actor's `&UID`. No other contract or user can call `object_grant_permission` with that actor's UID unless the defining contract explicitly allows it.

See [Extending](Extending.md) for a full walkthrough with code examples.

## Pause / Unpause

```move
public fun pause<T: drop>(self: &mut PermissionedGroup<T>, ctx: &mut TxContext): UnpauseCap<T>
public fun unpause<T: drop>(self: &mut PermissionedGroup<T>, cap: UnpauseCap<T>, ctx: &TxContext)
```

- `pause()` adds a `PausedMarker` dynamic field and returns an `UnpauseCap<T>`
- While paused, all mutations are blocked
- Only the holder of `UnpauseCap` can unpause
- **Archive pattern**: pause the group and destroy the `UnpauseCap` to permanently freeze it

## Group Creation

Two creation modes:

```move
// Fresh group with a random UID
public fun new<T: drop>(_witness: T, ctx: &mut TxContext): PermissionedGroup<T>

// Derived group with a deterministic address
public fun new_derived<T: drop, DerivationKey: copy + drop + store>(
    _witness: T,
    derivation_uid: &mut UID,
    derivation_key: DerivationKey,
    ctx: &mut TxContext,
): PermissionedGroup<T>
```

Derived groups use `sui::derived_object` for deterministic addresses -- the group's ID is predictable before the transaction executes.

## Delete

```move
public fun delete<T: drop>(self: PermissionedGroup<T>, ctx: &TxContext): (PermissionsTable, u64, address)
```

Returns the `PermissionsTable` for cleanup in your extending contract (e.g., `permissions_table::destroy_empty()`). Requires `GroupDeleter` permission.

## Events

All events are parameterized by `T`, so you can filter events for your application:

| Event | Emitted When |
|-------|-------------|
| `GroupCreated<T>` | New group created via `new()` |
| `GroupDerived<T, DerivationKey>` | Derived group created via `new_derived()` |
| `GroupDeleted<T>` | Group destroyed via `delete()` |
| `GroupPaused<T>` | Group paused |
| `GroupUnpaused<T>` | Group unpaused |
| `MemberAdded<T>` | First permission granted to an address |
| `MemberRemoved<T>` | Last permission revoked from an address |
| `PermissionsGranted<T>` | One or more permissions granted |
| `PermissionsRevoked<T>` | One or more permissions revoked |

## Display Standard

Groups can be rendered in wallets and explorers using the Sui Display standard. The package provides a shared `PermissionedGroupPublisher` object. Extending packages call `setup_display<T>()` with their own `Publisher` to create `Display<PermissionedGroup<T>>`.

Display fields: `name`, `description`, `creator`, `image_url`, `project_url`, `link`.

See [Extending](Extending.md) for setup instructions.

---

[Back to top](#contents) | [Installation](Installation.md) | [Setup](Setup.md) | [Extending](Extending.md) | [API Reference](APIRef.md) | [Examples](Examples.md) | [Testing](Testing.md)
