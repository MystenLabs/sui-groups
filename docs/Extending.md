## Contents

- [Step 1: Write Your Move Package](#step-1-write-your-move-package)
  - [Define a witness type](#define-a-witness-type)
  - [Define custom permissions](#define-custom-permissions)
  - [Create groups](#create-groups)
  - [Grant and revoke permissions](#grant-and-revoke-permissions)
- [Step 2: The Actor Object Pattern](#step-2-the-actor-object-pattern)
  - [Why actors exist](#why-actors-exist)
  - [Example: Self-service join and leave](#example-self-service-join-and-leave)
  - [Setup flow](#setup-flow)
- [Step 3: Display Standard Integration](#step-3-display-standard-integration)
- [Step 4: Build the TypeScript Client Extension](#step-4-build-the-typescript-client-extension)
  - [Define a client class](#define-a-client-class)
  - [Create the extension factory](#create-the-extension-factory)
  - [Compose extensions](#compose-extensions)
- [Step 5: Events and Indexing](#step-5-events-and-indexing)

# Extending

The whole point of `@mysten/sui-groups` is to be extended. `PermissionedGroup<T>` is generic -- `T` is **your** witness type from **your** package. Your Move package defines the witness, custom permissions, and actor objects. Your TS client extension wraps `@mysten/sui-groups` to provide domain-specific methods.

This guide walks through the full process. For a minimal working reference, see the [example-group](../../move/packages/example-group/sources/example_group.move) Move package. For a comprehensive real-world example, see the [Sui Stack Messaging](../sui-stack-messaging/README.md) SDK, which extends `sui_groups` with encrypted messaging.

## Step 1: Write Your Move Package

### Define a witness type

```move
module my_pkg::my_app;

use sui_groups::permissioned_group::{Self, PermissionedGroup};

/// Witness type -- scopes all permissions and events to this package.
public struct MyWitness() has drop;
```

### Define custom permissions

```move
/// Users with this permission can edit content.
public struct Editor() has drop;

/// Users with this permission can view content.
public struct Viewer() has drop;
```

### Create groups

The TS SDK does not expose `permissioned_group::new` or `new_derived` directly because they require your package's witness as an argument. Your contract should expose its own wrapper (see [API Reference -- What the TS SDK Does Not Expose](APIRef.md#what-the-ts-sdk-does-not-expose)):

```move
/// Creates a new group. The transaction sender becomes the creator with PermissionsAdmin.
public fun create_group(ctx: &mut TxContext): PermissionedGroup<MyWitness> {
    permissioned_group::new(MyWitness(), ctx)
}
```

### Grant and revoke permissions

For direct admin operations, the TS SDK's `grantPermission` / `revokePermission` methods work out of the box. They call the Move-level `grant_permission<T, P>()` and `revoke_permission<T, P>()` with the correct type parameters.

For custom logic (join rules, leave rules, etc.), use the actor object pattern below.

## Step 2: The Actor Object Pattern

The actor object pattern enables your contract to implement **custom logic** over group membership operations. Instead of an admin directly granting/revoking permissions, an actor object mediates the operation with whatever rules you define.

For background on the pattern, see [Smart Contracts -- Actor Object Pattern](SmartContracts.md#actor-object-pattern).

### Why actors exist

The `object_grant_permission`, `object_revoke_permission`, and `object_remove_member` Move functions accept `&UID` of an actor object. The group verifies that the actor's address has the required permissions (`ExtensionPermissionsAdmin` for extension permissions, `PermissionsAdmin` for core permissions). Because `&UID` can only be obtained from within the Move module that owns the actor struct, **only your contract can invoke these operations** -- no external contract or user can bypass your custom logic.

### Example: Self-service join and leave

From [example_group.move](../../move/packages/example-group/sources/example_group.move):

```move
/// Actor object that enables self-service join/leave.
public struct JoinActor has key {
    id: UID,
    group_id: ID,
}

/// Creates a JoinActor. The actor's address must be granted
/// ExtensionPermissionsAdmin on the group.
public fun new_join_actor(group_id: ID, ctx: &mut TxContext): JoinActor {
    JoinActor { id: object::new(ctx), group_id }
}

/// Anyone can call this to join the group with CustomMemberPermission.
public fun join(
    actor: &JoinActor,
    group: &mut PermissionedGroup<ExampleGroupWitness>,
    ctx: &TxContext,
) {
    assert!(actor.group_id == object::id(group));

    // Add your custom logic & rules here

    permissioned_group::object_grant_permission<ExampleGroupWitness, CustomMemberPermission>(
        group,
        &actor.id,
        ctx.sender(),
    );
}

/// Any member can call this to leave the group, without waiting for an Admin to remove them.
public fun leave(
    actor: &JoinActor,
    group: &mut PermissionedGroup<ExampleGroupWitness>,
    ctx: &TxContext,
) {
    assert!(actor.group_id == object::id(group));
    permissioned_group::object_remove_member<ExampleGroupWitness>(
        group,
        &actor.id,
        ctx.sender(),
    );
}
```

### Setup flow

1. Create the group and the actor object
2. Grant `ExtensionPermissionsAdmin/PermissionsAdmin` (and optionally `ObjectAdmin`) to the actor's address
3. Share the actor object so anyone can call `join()` / `leave()`

```move
public fun setup(ctx: &mut TxContext) {
    let mut group = create_group(ctx);
    let actor = new_join_actor(object::id(&group), ctx);

    // Grant the actor the ability to manage permissions
    permissioned_group::grant_permission<ExampleGroupWitness, PermissionsAdmin>(
        &mut group,
        join_actor_address(&actor),
        ctx,
    );

    transfer::share_object(group);
    transfer::share_object(actor);
}
```

## Step 3: Display Standard Integration

Groups are shared objects and appear on explorers. Customize how they render using the Sui Display standard.

The `sui_groups` package provides a shared `PermissionedGroupPublisher` object that holds the package's `Publisher`. Your package needs its own `Publisher` to create a `Display<PermissionedGroup<T>>`:

```move
module my_pkg::display_setup;

use sui_groups::display;
use sui::package;

/// One-time witness for claiming Publisher.
public struct DISPLAY_SETUP has drop {}

fun init(otw: DISPLAY_SETUP, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    // PermissionedGroupPublisher is a shared object -- pass it by reference.
    // This call creates and shares a Display<PermissionedGroup<MyWitness>>.
    display::setup_display<MyWitness>(
        &pg_publisher,  // PermissionedGroupPublisher (shared)
        &publisher,     // Your package's Publisher
        b"My App Groups".to_string(),
        b"Permissioned groups for My App".to_string(),
        b"https://example.com/group-icon.png".to_string(),
        b"https://example.com".to_string(),
        b"https://example.com/groups/{id}".to_string(),
        ctx,
    );

    transfer::public_transfer(publisher, ctx.sender());
}
```

Display fields created: `name`, `description`, `creator`, `image_url`, `project_url`, `link`.

For more on the Display standard in the context of groups, see [Smart Contracts -- Display Standard](SmartContracts.md#display-standard).

## Step 4: Build the TypeScript Client Extension

Follow the [MystenLabs TS SDK building guidelines](https://sdk.mystenlabs.com/sui/sdk-building).

### Define a client class

For a comprehensive extension, define a client class that encapsulates your domain logic, and an extension factory with a `register` function that instantiates it:

```typescript
import type { PermissionedGroupsClient } from '@mysten/sui-groups';
import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { Transaction } from '@mysten/sui/transactions';

const MY_PKG = '0xYOUR_PACKAGE_ID';

/** Client type that requires the groups extension. */
type MyAppCompatibleClient = ClientWithCoreApi & {
  groups: PermissionedGroupsClient;
};

class MyAppClient {
  #client: MyAppCompatibleClient;

  constructor(client: MyAppCompatibleClient) {
    this.#client = client;
  }

  /** Transaction thunk: join a group via the JoinActor. */
  join(actorId: string, groupId: string) {
    return (tx: Transaction) => {
      tx.moveCall({
        target: `${MY_PKG}::my_app::join`,
        arguments: [tx.object(actorId), tx.object(groupId)],
      });
    };
  }

  /** Transaction thunk: leave a group via the JoinActor. */
  leave(actorId: string, groupId: string) {
    return (tx: Transaction) => {
      tx.moveCall({
        target: `${MY_PKG}::my_app::leave`,
        arguments: [tx.object(actorId), tx.object(groupId)],
      });
    };
  }
}
```

### Create the extension factory

```typescript
function myApp() {
  return {
    name: 'myApp' as const,
    register: (client: MyAppCompatibleClient) => new MyAppClient(client),
  };
}
```

### Compose extensions

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suiGroups } from '@mysten/sui-groups';

const client = new SuiGrpcClient({
  baseUrl: 'https://fullnode.testnet.sui.io:443',
  network: 'testnet',
}).$extend(
  suiGroups({ witnessType: `${MY_PKG}::my_app::MyWitness` }),
  myApp(),
);

// Use the base groups SDK for permission management
await client.groups.grantPermission({ ... });

// Use your custom extension for domain-specific operations
const tx = new Transaction();
tx.add(client.myApp.join(actorId, groupId));
await keypair.signAndExecuteTransaction({ transaction: tx, client });
```

See [Setup](Setup.md) for the full configuration reference.

## Step 5: Events and Indexing

All permission changes emit typed events parameterized by your witness type:

- `MemberAdded<MyWitness>` / `MemberRemoved<MyWitness>`
- `PermissionsGranted<MyWitness>` / `PermissionsRevoked<MyWitness>`

Since `T` is your witness type, these events are scoped to your application. You can filter them without interference from other packages using the same `sui_groups` contract.

Build indexers on these events for:

- Group discovery (which groups does a user belong to)
- Permission dashboards
- Audit trails
- Real-time notifications

For the full list of events, see [Smart Contracts -- Events](SmartContracts.md#events).

---

[Back to top](#contents)
