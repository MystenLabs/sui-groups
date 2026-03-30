/// Module: self_service_actor
///
/// Test helper module demonstrating how third-party contracts wrap `object_*` methods.
///
/// This module shows the pattern for building "actor objects" that enable self-service
/// operations on PermissionedGroups. Key points:
///
/// 1. The `UID` field is private to this module - callers cannot access it directly
/// 2. All group operations go through wrapper functions that can enforce custom logic
/// 3. The actor object's address receives permissions, not the end users
/// 4. Users call wrapper functions to perform operations on themselves
///
/// Real-world examples:
/// - `PaidJoinActor`: Requires payment before calling `object_grant_permission`
/// - `TokenGatedActor`: Requires NFT ownership to join
/// - `CooldownActor`: Enforces time-based restrictions on operations
#[test_only]
module sui_groups::self_service_actor;

use sui_groups::permissioned_group::PermissionedGroup;

/// Actor object that enables self-service group operations.
/// The UID is private, forcing all access through wrapper functions.
public struct SelfServiceActor has key {
    id: UID,
}

// === Lifecycle Functions ===

/// Creates a new SelfServiceActor.
/// In production, this might require payment, NFT ownership, etc.
public fun new(ctx: &mut TxContext): SelfServiceActor {
    SelfServiceActor { id: object::new(ctx) }
}

/// Shares the SelfServiceActor object.
public fun share(self: SelfServiceActor) {
    transfer::share_object(self);
}

/// Returns the actor's address for permission setup.
/// The group admin grants permissions to this address, not to end users.
public fun to_address(actor: &SelfServiceActor): address {
    actor.id.to_address()
}

// === Custom Logic Placeholder ===

/// Placeholder for custom logic and assertions.
/// In a real implementation, this could contain:
/// - Payment verification (e.g., require Coin<SUI> with minimum amount)
/// - NFT ownership checks (e.g., require holding a specific collection)
/// - Time-based restrictions (e.g., cooldown periods between operations)
/// - Rate limiting (e.g., max operations per epoch)
/// - Allowlist/blocklist checks
/// - Any other business logic to gate access to group operations
fun custom_logic_and_assertions(_ctx: &TxContext) {}  // Takes immutable ref since object_* no longer need ctx

// === Self-Service Wrapper Functions ===
// Users call these to perform operations on themselves through the actor.
// Each wrapper calls custom_logic_and_assertions() before the actual operation.

/// Self-service remove: sender removes themselves from the group via the actor.
/// Actor must have `PermissionsAdmin` permission.
/// Note: For simple self-leave, prefer the native `group.leave()` with `SelfLeave` permission.
public fun custom_remove_member<T: drop>(
    actor: &SelfServiceActor,
    group: &mut PermissionedGroup<T>,
    ctx: &TxContext,
) {
    custom_logic_and_assertions(ctx);
    group.object_remove_member<T>(&actor.id, ctx.sender());
}

/// Self-service grant: sender grants themselves a permission.
/// Actor must have `PermissionsAdmin` (for core permissions) or
/// `ExtensionPermissionsAdmin` (for extension permissions).
public fun custom_grant_permission<T: drop, P: drop>(
    actor: &SelfServiceActor,
    group: &mut PermissionedGroup<T>,
    ctx: &TxContext,
) {
    custom_logic_and_assertions(ctx);
    group.object_grant_permission<T, P>(&actor.id, ctx.sender());
}

/// Self-service revoke: sender revokes a permission from themselves.
/// Actor must have `PermissionsAdmin` (for core permissions) or
/// `ExtensionPermissionsAdmin` (for extension permissions).
public fun custom_revoke_permission<T: drop, P: drop>(
    actor: &SelfServiceActor,
    group: &mut PermissionedGroup<T>,
    ctx: &TxContext,
) {
    custom_logic_and_assertions(ctx);
    group.object_revoke_permission<T, P>(&actor.id, ctx.sender());
}

/// Returns a reference to the group's UID via the actor object.
/// Actor must have `ObjectAdmin` permission.
public fun custom_uid<T: drop>(
    actor: &SelfServiceActor,
    group: &PermissionedGroup<T>,
    ctx: &TxContext,
): &UID {
    custom_logic_and_assertions(ctx);
    group.object_uid<T>(&actor.id)
}

/// Returns a mutable reference to the group's UID via the actor object.
/// Actor must have `ObjectAdmin` permission.
public fun custom_uid_mut<T: drop>(
    actor: &SelfServiceActor,
    group: &mut PermissionedGroup<T>,
    ctx: &TxContext,
): &mut UID {
    custom_logic_and_assertions(ctx);
    group.object_uid_mut<T>(&actor.id)
}

// === Tests ===

// Module is already #[test_only] — no need for per-item annotations.
use sui_groups::permissioned_group;
use sui_groups::permissioned_group::ExtensionPermissionsAdmin;
use sui_groups::permissioned_group::PermissionsAdmin;
use sui::test_scenario as ts;
use std::unit_test::assert_eq;

const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;

public struct TestWitness() has drop;

public struct CustomPermission() has drop;

#[test]
fun actor_grant_permission_works() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant ExtensionPermissionsAdmin to the actor (CustomPermission is an extension permission)
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(actor_obj.to_address(), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob uses actor to grant himself CustomPermission
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_grant_permission<TestWitness, CustomPermission>(&mut group, ts.ctx());

    assert_eq!(group.has_permission<TestWitness, CustomPermission>(BOB), true);
    assert_eq!(group.is_member(BOB), true);

    ts::return_shared(group);
    ts::return_shared(actor_obj);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun actor_grant_permission_without_permission_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant CustomPermission to actor (not sufficient for granting permissions to others)
    group.grant_permission<TestWitness, CustomPermission>(actor_obj.to_address(), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob tries to use actor to grant himself permission (should fail - actor lacks manager permission)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_grant_permission<TestWitness, CustomPermission>(&mut group, ts.ctx());

    abort
}

#[test]
fun actor_revoke_permission_works() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant ExtensionPermissionsAdmin to the actor and CustomPermission to Bob
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(to_address(&actor_obj), ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob uses actor to revoke his own CustomPermission
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_revoke_permission<TestWitness, CustomPermission>(&mut group, ts.ctx());

    assert_eq!(group.is_member(BOB), false);

    ts::return_shared(group);
    ts::return_shared(actor_obj);
    ts.end();
}

#[test]
fun actor_custom_remove_member_works() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant PermissionsAdmin to the actor (remove_member requires PermissionsAdmin) and CustomPermission to Bob
    group.grant_permission<TestWitness, PermissionsAdmin>(to_address(&actor_obj), ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob uses actor to remove himself
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_remove_member<TestWitness>(&mut group, ts.ctx());

    assert_eq!(group.is_member(BOB), false);

    ts::return_shared(group);
    ts::return_shared(actor_obj);
    ts.end();
}

// === Failure tests for object_* functions ===

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun actor_remove_member_without_permission_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Actor has no PermissionsAdmin permission
    group.grant_permission<TestWitness, CustomPermission>(to_address(&actor_obj), ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob tries to use actor to remove himself (should fail - actor lacks PermissionsAdmin)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_remove_member<TestWitness>(&mut group, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::EMemberNotFound)]
fun actor_remove_non_member_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant PermissionsAdmin to actor
    group.grant_permission<TestWitness, PermissionsAdmin>(to_address(&actor_obj), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob (not a member) tries to use actor to remove himself (should fail - not a member)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_remove_member<TestWitness>(&mut group, ts.ctx());

    abort
}

// === object_uid and object_uid_mut tests ===

use sui_groups::permissioned_group::ObjectAdmin;

#[test]
fun actor_uid_with_permission_works() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant ObjectAdmin to the actor
    group.grant_permission<TestWitness, ObjectAdmin>(actor_obj.to_address(), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Access &UID via actor wrapper
    ts.next_tx(ALICE);
    let group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    let _uid_ref = actor_obj.custom_uid<TestWitness>(&group, ts.ctx());

    ts::return_shared(group);
    ts::return_shared(actor_obj);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun actor_uid_without_permission_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Actor has no ObjectAdmin — grant only CustomPermission
    group.grant_permission<TestWitness, CustomPermission>(actor_obj.to_address(), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    ts.next_tx(ALICE);
    let group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    let _uid_ref = actor_obj.custom_uid<TestWitness>(&group, ts.ctx());

    abort
}

#[test]
fun actor_uid_mut_with_permission_works() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant ObjectAdmin to the actor
    group.grant_permission<TestWitness, ObjectAdmin>(actor_obj.to_address(), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Access &mut UID via actor wrapper
    ts.next_tx(ALICE);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    let _uid_mut = actor_obj.custom_uid_mut<TestWitness>(&mut group, ts.ctx());

    ts::return_shared(group);
    ts::return_shared(actor_obj);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun actor_uid_mut_without_permission_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Actor has no ObjectAdmin — grant only CustomPermission
    group.grant_permission<TestWitness, CustomPermission>(actor_obj.to_address(), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    ts.next_tx(ALICE);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    let _uid_mut = actor_obj.custom_uid_mut<TestWitness>(&mut group, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::EMemberNotFound)]
fun actor_revoke_permission_non_member_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let actor_obj = new(ts.ctx());

    // Grant ExtensionPermissionsAdmin to actor (CustomPermission is an extension permission)
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(to_address(&actor_obj), ts.ctx());
    transfer::public_share_object(group);
    actor_obj.share();

    // Bob (not a member) tries to use actor to revoke permission (should fail)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let actor_obj = ts.take_shared<SelfServiceActor>();
    actor_obj.custom_revoke_permission<TestWitness, CustomPermission>(&mut group, ts.ctx());

    abort
}
