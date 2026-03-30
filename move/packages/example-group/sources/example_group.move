/// Module: example_group
///
/// Example package demonstrating how to extend `permissioned_groups`.
///
/// ## Key Patterns Shown
///
/// 1. **Witness type**: `ExampleGroupWitness` scopes permissions to this package.
///    `new()` and `new_derived()` require a witness instance, so only the defining
///    package can create groups of that type.
///
/// 2. **Group creation wrappers**: `create_group()` and `create_derived_group()` wrap
///    the core `permissioned_group::new` and `new_derived` calls, proving ownership of
///    the witness type.
///
/// 3. **Extension permission**: `CustomMemberPermission` is a permission type defined
///    outside `permissioned_groups`. It can be managed by `ExtensionPermissionsAdmin`
///    (but NOT by `PermissionsAdmin`).
///
/// 4. **Self-service actor**: `JoinActor` demonstrates the actor pattern — an on-chain
///    object that holds permissions and lets users perform self-service operations.
///    The actor's UID is passed to `object_grant_permission`, which checks that the
///    actor has the required admin permission before granting to the sender.
///
module example_group::example_group;

use sui_groups::permissioned_group::{Self, PermissionedGroup};

// === Witness & Permission Types ===

/// Witness type scoping permissions to this package.
/// Uses PascalCase to avoid One-Time Witness convention (ALL_CAPS + matching module name).
public struct ExampleGroupWitness() has drop;

/// An extension permission defined outside the `permissioned_groups` package.
/// Managed by `ExtensionPermissionsAdmin`, not `PermissionsAdmin`.
public struct CustomMemberPermission() has drop;

// === Group Creation ===

/// Creates a new `PermissionedGroup` scoped to `ExampleGroupWitness`.
/// The caller (sender) becomes the initial admin with `PermissionsAdmin`,
/// `ExtensionPermissionsAdmin`, and `Destroyer` permissions.
public fun create_group(ctx: &mut TxContext): PermissionedGroup<ExampleGroupWitness> {
    permissioned_group::new(ExampleGroupWitness(), ctx)
}

/// Creates a new derived `PermissionedGroup` with deterministic address.
/// Useful when you need a predictable group address (e.g., for Seal policies).
public fun create_derived_group<DerivationKey: copy + drop + store>(
    derivation_uid: &mut UID,
    derivation_key: DerivationKey,
    ctx: &mut TxContext,
): PermissionedGroup<ExampleGroupWitness> {
    permissioned_group::new_derived(ExampleGroupWitness(), derivation_uid, derivation_key, ctx)
}

// === Self-Service Actor ===

/// Actor object that enables self-service group joining.
///
/// ## Usage
/// 1. Admin creates the actor and grants it `ExtensionPermissionsAdmin` on the group.
/// 2. The actor is shared so anyone can interact with it.
/// 3. Users call `join()` to grant themselves `CustomMemberPermission` through the actor.
///
/// In a real application, `join()` could enforce payment, NFT ownership, cooldowns, etc.
public struct JoinActor has key {
    id: UID,
    /// The group this actor is associated with.
    group_id: ID,
}

/// Creates a new `JoinActor` for the given group.
/// The returned object should be shared after granting it `ExtensionPermissionsAdmin`.
public fun new_join_actor(group_id: ID, ctx: &mut TxContext): JoinActor {
    JoinActor {
        id: object::new(ctx),
        group_id,
    }
}

/// Returns the actor's address (for granting permissions to it).
public fun join_actor_address(actor: &JoinActor): address {
    actor.id.to_address()
}

/// Shares the actor object so anyone can call `join()`.
public fun share_join_actor(actor: JoinActor) {
    transfer::share_object(actor);
}

/// Self-service join: sender grants themselves `CustomMemberPermission` through the actor.
/// Actor must have `ExtensionPermissionsAdmin` on the group.
///
/// In a real application, add custom logic before the grant (payment, gating, etc.).
public fun join(
    actor: &JoinActor,
    group: &mut PermissionedGroup<ExampleGroupWitness>,
    ctx: &TxContext,
) {
    assert!(object::id(group) == actor.group_id, EGroupMismatch);
    group.object_grant_permission<ExampleGroupWitness, CustomMemberPermission>(
        &actor.id,
        ctx.sender(),
    );
}

/// Self-service leave: sender revokes their `CustomMemberPermission` through the actor.
/// Actor must have `ExtensionPermissionsAdmin` on the group.
public fun leave(
    actor: &JoinActor,
    group: &mut PermissionedGroup<ExampleGroupWitness>,
    ctx: &TxContext,
) {
    assert!(object::id(group) == actor.group_id, EGroupMismatch);
    group.object_revoke_permission<ExampleGroupWitness, CustomMemberPermission>(
        &actor.id,
        ctx.sender(),
    );
}

// === Error Codes ===

const EGroupMismatch: u64 = 0;
