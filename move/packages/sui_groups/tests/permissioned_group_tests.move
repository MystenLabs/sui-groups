#[test_only]
module sui_groups::permissioned_group_tests;

use sui_groups::permissioned_group::{
    Self,
    PermissionedGroup,
    PermissionsAdmin,
    ExtensionPermissionsAdmin,
    GroupDeleter
};
use sui_groups::permissions_table;
use sui_groups::unpause_cap::UnpauseCap;
use std::unit_test::{assert_eq, destroy};
use sui::test_scenario as ts;

// === Test Addresses ===

const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;
const CHARLIE: address = @0xC4A1E;

// === Test Witness ===

/// Package witness for testing.
public struct TestWitness() has drop;

/// Custom permission for testing (core — same package as permissioned_groups).
public struct CustomPermission() has drop;

// === Test Derivation Key ===

/// Derivation key for testing new_derived.
public struct TestDerivationKey(u64) has copy, drop, store;

// === Test Namespace ===

/// Shared object used as namespace for deriving group addresses in tests.
public struct TestNamespace has key {
    id: UID,
}

// === new tests ===

#[test]
fun new_creates_group_with_creator_as_administrator() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Creator should have all core permissions
    assert!(group.has_permission<TestWitness, PermissionsAdmin>(ALICE));
    assert!(group.has_permission<TestWitness, ExtensionPermissionsAdmin>(ALICE));
    assert!(group.is_member(ALICE));
    assert_eq!(group.creator<TestWitness>(), ALICE);
    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);

    destroy(group);
    ts.end();
}

// === grant_permission tests ===

#[test]
fun grant_permission_adds_new_member() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Alice grants CustomPermission to Bob (Bob doesn't exist yet)
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    assert!(group.is_member(BOB));
    assert!(group.has_permission<TestWitness, CustomPermission>(BOB));

    destroy(group);
    ts.end();
}

#[test]
fun grant_permission_to_existing_member() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Add Bob with CustomPermission
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    // Grant PermissionsAdmin to Bob (already a member)
    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());

    assert!(group.is_member(BOB));
    assert!(group.has_permission<TestWitness, CustomPermission>(BOB));
    assert!(group.has_permission<TestWitness, PermissionsAdmin>(BOB));
    assert_eq!(group.permissions_admin_count<TestWitness>(), 2);

    destroy(group);
    ts.end();
}

#[test]
fun grant_administrator_increments_count() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);

    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 2);

    destroy(group);
    ts.end();
}

#[test]
fun extension_admin_can_grant_custom_permission() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant ExtensionPermissionsAdmin to Bob
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob grants CustomPermission to Charlie (extension permission — requires
    // ExtensionPermissionsAdmin)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.grant_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());

    assert!(group.has_permission<TestWitness, CustomPermission>(CHARLIE));

    ts::return_shared(group);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun extension_manager_cannot_grant_administrator() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant only ExtensionPermissionsAdmin to Bob
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to grant PermissionsAdmin to Charlie (should fail)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.grant_permission<TestWitness, PermissionsAdmin>(CHARLIE, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun non_manager_cannot_grant_permission() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant CustomPermission to Bob (not a manager permission)
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to grant permission to Charlie (should fail)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.grant_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());

    abort
}

// === revoke_permission tests ===

#[test]
fun revoke_permission_keeps_member_if_has_other_permissions() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob both CustomPermission and ExtensionPermissionsAdmin
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());

    // Revoke CustomPermission
    group.revoke_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    // Bob should still be a member with ExtensionPermissionsAdmin
    assert!(group.is_member(BOB));
    assert!(!group.has_permission<TestWitness, CustomPermission>(BOB));
    assert!(group.has_permission<TestWitness, ExtensionPermissionsAdmin>(BOB));

    destroy(group);
    ts.end();
}

#[test]
fun revoke_last_permission_removes_member() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob only CustomPermission
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    assert!(group.is_member(BOB));

    // Revoke Bob's only permission
    group.revoke_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    // Bob should no longer be a member
    assert!(!group.is_member(BOB));

    destroy(group);
    ts.end();
}

#[test]
fun revoke_administrator_decrements_count() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob PermissionsAdmin
    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 2);

    // Revoke PermissionsAdmin from Bob
    group.revoke_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);

    destroy(group);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ELastPermissionsAdmin)]
fun revoke_last_administrator_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Try to revoke Alice's PermissionsAdmin (she's the only one)
    group.revoke_permission<TestWitness, PermissionsAdmin>(ALICE, ts.ctx());

    abort
}

#[test]
fun extension_admin_can_revoke_custom_permission() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant ExtensionPermissionsAdmin to Bob and CustomPermission to Charlie
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());
    transfer::public_share_object(group);

    // Bob revokes Charlie's CustomPermission (extension permission — requires
    // ExtensionPermissionsAdmin)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.revoke_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());

    assert!(!group.is_member(CHARLIE));

    ts::return_shared(group);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun extension_manager_cannot_revoke_administrator() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant ExtensionPermissionsAdmin to Bob and PermissionsAdmin to Charlie
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());
    group.grant_permission<TestWitness, PermissionsAdmin>(CHARLIE, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to revoke PermissionsAdmin from Charlie (should fail)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.revoke_permission<TestWitness, PermissionsAdmin>(CHARLIE, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::EMemberNotFound)]
fun revoke_permission_from_non_member_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Try to revoke permission from Bob who is not a member
    group.revoke_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    abort
}

// === remove_member tests ===

#[test]
fun remove_member_removes_member() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Add Bob with CustomPermission
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    assert!(group.is_member(BOB));

    // Remove Bob
    group.remove_member<TestWitness>(BOB, ts.ctx());
    assert!(!group.is_member(BOB));

    destroy(group);
    ts.end();
}

#[test]
fun remove_administrator_decrements_count() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob PermissionsAdmin
    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 2);

    // Remove Bob
    group.remove_member<TestWitness>(BOB, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);

    destroy(group);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ELastPermissionsAdmin)]
fun remove_last_administrator_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Try to remove Alice (only PermissionsAdmin)
    group.remove_member<TestWitness>(ALICE, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun remove_member_without_permission_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob only ExtensionPermissionsAdmin
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to remove Charlie (should fail - needs PermissionsAdmin)
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.remove_member<TestWitness>(CHARLIE, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::EMemberNotFound)]
fun remove_non_member_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Try to remove Bob who is not a member
    group.remove_member<TestWitness>(BOB, ts.ctx());

    abort
}

// === Getters tests ===

#[test]
fun has_permission_returns_correct_value() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    assert!(group.has_permission<TestWitness, PermissionsAdmin>(ALICE));
    assert!(group.has_permission<TestWitness, CustomPermission>(BOB));
    assert!(!group.has_permission<TestWitness, PermissionsAdmin>(BOB));

    destroy(group);
    ts.end();
}

#[test]
fun is_member_returns_correct_value() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    assert!(group.is_member(ALICE));
    assert!(group.is_member(BOB));
    assert!(!group.is_member(CHARLIE));

    destroy(group);
    ts.end();
}

#[test]
fun creator_returns_correct_address() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    assert_eq!(group.creator<TestWitness>(), ALICE);

    destroy(group);
    ts.end();
}

#[test]
fun permissions_admin_count_returns_correct_value() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);

    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 2);

    group.grant_permission<TestWitness, PermissionsAdmin>(CHARLIE, ts.ctx());
    assert_eq!(group.permissions_admin_count<TestWitness>(), 3);

    destroy(group);
    ts.end();
}

// === new_derived tests ===

#[test]
fun new_derived_creates_group_with_deterministic_address() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let namespace = TestNamespace {
        id: object::new(ts.ctx()),
    };
    transfer::share_object(namespace);

    ts.next_tx(ALICE);
    let mut namespace = ts.take_shared<TestNamespace>();
    let group = permissioned_group::new_derived<TestWitness, TestDerivationKey>(
        TestWitness(),
        &mut namespace.id,
        TestDerivationKey(1),
        ts.ctx(),
    );

    // Creator should have all core permissions
    assert!(group.has_permission<TestWitness, PermissionsAdmin>(ALICE));
    assert!(group.has_permission<TestWitness, ExtensionPermissionsAdmin>(ALICE));
    assert!(group.is_member(ALICE));
    assert_eq!(group.creator<TestWitness>(), ALICE);
    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);

    destroy(group);
    ts::return_shared(namespace);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::EPermissionedGroupAlreadyExists)]
fun new_derived_duplicate_key_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let namespace = TestNamespace {
        id: object::new(ts.ctx()),
    };
    transfer::share_object(namespace);

    ts.next_tx(ALICE);
    let mut namespace = ts.take_shared<TestNamespace>();

    // Create first group with key 1
    let _group1 = permissioned_group::new_derived<TestWitness, TestDerivationKey>(
        TestWitness(),
        &mut namespace.id,
        TestDerivationKey(1),
        ts.ctx(),
    );

    // Try to create second group with same key (should fail)
    let _group2 = permissioned_group::new_derived<TestWitness, TestDerivationKey>(
        TestWitness(),
        &mut namespace.id,
        TestDerivationKey(1),
        ts.ctx(),
    );

    abort
}

// === member_count / permissions_table::length() tests ===

#[test]
fun member_count_reflects_adds_and_removes() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Creator counts as 1 member
    assert_eq!(group.member_count<TestWitness>(), 1);

    // Add Bob → 2 members
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    assert_eq!(group.member_count<TestWitness>(), 2);

    // Add Charlie → 3 members
    group.grant_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());
    assert_eq!(group.member_count<TestWitness>(), 3);

    // Remove Charlie → 2 members
    group.remove_member<TestWitness>(CHARLIE, ts.ctx());
    assert_eq!(group.member_count<TestWitness>(), 2);

    // Revoke Bob's last permission (auto-removes) → 1 member
    group.revoke_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    assert_eq!(group.member_count<TestWitness>(), 1);

    destroy(group);
    ts.end();
}

// === Duplicate grant test ===

#[test, expected_failure(abort_code = sui::vec_set::EKeyAlreadyExists)]
fun grant_same_permission_twice_fails() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant CustomPermission to Bob once — succeeds
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    // Grant the same permission again — aborts with vec_set::EKeyAlreadyExists
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    abort
}

// === Permission scoping tests ===

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun permissions_admin_cannot_manage_extension_permission() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant only PermissionsAdmin to Bob (not ExtensionPermissionsAdmin)
    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to grant CustomPermission (extension) — should fail
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.grant_permission<TestWitness, CustomPermission>(CHARLIE, ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun extension_admin_cannot_manage_core_permission() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob only ExtensionPermissionsAdmin
    group.grant_permission<TestWitness, ExtensionPermissionsAdmin>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to grant PermissionsAdmin (core permission) — should fail
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    group.grant_permission<TestWitness, PermissionsAdmin>(CHARLIE, ts.ctx());

    abort
}

// === delete tests ===

#[test]
fun delete_returns_components() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Creator does NOT auto-get GroupDeleter — must grant explicitly
    group.grant_permission<TestWitness, GroupDeleter>(ALICE, ts.ctx());
    let (permissions, admin_count, creator) = group.delete<TestWitness>(ts.ctx());

    assert_eq!(admin_count, 1);
    assert_eq!(creator, ALICE);

    // Table still has members, so we can't destroy_empty — use test destroy
    destroy(permissions);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun delete_without_group_deleter_aborts() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob only CustomPermission (no GroupDeleter)
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to delete — should fail (no GroupDeleter permission)
    ts.next_tx(BOB);
    let group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let (_permissions, _admin_count, _creator) = group.delete<TestWitness>(ts.ctx());

    abort
}

#[test]
fun group_deleter_is_core_permission() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // PermissionsAdmin can grant GroupDeleter (core permission)
    group.grant_permission<TestWitness, GroupDeleter>(BOB, ts.ctx());
    assert!(group.has_permission<TestWitness, GroupDeleter>(BOB));

    // PermissionsAdmin can revoke GroupDeleter
    group.revoke_permission<TestWitness, GroupDeleter>(BOB, ts.ctx());
    assert!(!group.is_member(BOB));

    destroy(group);
    ts.end();
}

// === permissions_table destroy_empty tests ===

#[test]
fun permissions_table_destroy_empty_succeeds() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob PermissionsAdmin and GroupDeleter, then remove Alice
    group.grant_permission<TestWitness, PermissionsAdmin>(BOB, ts.ctx());
    group.grant_permission<TestWitness, GroupDeleter>(BOB, ts.ctx());
    group.remove_member<TestWitness>(ALICE, ts.ctx());
    transfer::public_share_object(group);

    // Bob deletes the group (he has GroupDeleter)
    ts.next_tx(BOB);
    let group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let (mut permissions, _admin_count, _creator) = group.delete<TestWitness>(ts.ctx());

    // Remove Bob from the permissions table
    permissions.remove_member(BOB);

    // Now table is empty, destroy_empty should succeed
    permissions.destroy_empty();

    ts.end();
}

#[test, expected_failure(abort_code = permissions_table::EPermissionsTableNotEmpty)]
fun permissions_table_destroy_empty_aborts_when_not_empty() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Alice GroupDeleter so she can delete
    group.grant_permission<TestWitness, GroupDeleter>(ALICE, ts.ctx());

    // Delete group — Alice is still a member in the returned table
    let (permissions, _admin_count, _creator) = group.delete<TestWitness>(ts.ctx());

    // Should abort because table still has Alice
    permissions.destroy_empty();

    abort
}

// === pause/unpause tests ===

#[test]
fun pause_sets_marker_and_returns_cap() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    assert!(!group.is_paused());
    let cap = group.pause<TestWitness>(ts.ctx());
    assert!(group.is_paused());

    destroy(cap);
    destroy(group);
    ts.end();
}

#[test]
fun unpause_clears_marker_and_consumes_cap() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    let cap = group.pause<TestWitness>(ts.ctx());
    assert!(group.is_paused());

    group.unpause<TestWitness>(cap, ts.ctx());
    assert!(!group.is_paused());

    destroy(group);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun pause_without_permissions_admin_aborts() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Grant Bob only CustomPermission (no PermissionsAdmin)
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    transfer::public_share_object(group);

    // Bob tries to pause — should fail
    ts.next_tx(BOB);
    let mut group = ts.take_shared<PermissionedGroup<TestWitness>>();
    let _cap = group.pause<TestWitness>(ts.ctx());

    abort
}

#[test, expected_failure(abort_code = permissioned_group::EAlreadyPaused)]
fun pause_already_paused_aborts() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    let cap = group.pause<TestWitness>(ts.ctx());
    // Pause again — should fail
    let _cap2 = group.pause<TestWitness>(ts.ctx());

    destroy(cap);
    abort
}

#[test, expected_failure(abort_code = permissioned_group::EGroupPaused)]
fun grant_permission_on_paused_group_aborts() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let cap = group.pause<TestWitness>(ts.ctx());

    // Try to grant — should fail
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());

    destroy(cap);
    abort
}

#[test]
fun paused_group_reads_still_work() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    group.grant_permission<TestWitness, CustomPermission>(BOB, ts.ctx());
    let cap = group.pause<TestWitness>(ts.ctx());

    // All read operations should still work on a paused group
    assert!(group.has_permission<TestWitness, PermissionsAdmin>(ALICE));
    assert!(group.has_permission<TestWitness, CustomPermission>(BOB));
    assert!(group.is_member(ALICE));
    assert!(group.is_member(BOB));
    assert!(!group.is_member(CHARLIE));
    assert_eq!(group.creator<TestWitness>(), ALICE);
    assert_eq!(group.permissions_admin_count<TestWitness>(), 1);
    assert!(group.is_paused());

    destroy(cap);
    destroy(group);
    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::EGroupIdMismatch)]
fun unpause_with_wrong_cap_aborts() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    // Create two groups
    let mut group1 = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());
    let mut group2 = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    // Pause both, get caps
    let cap1 = group1.pause<TestWitness>(ts.ctx());
    let _cap2 = group2.pause<TestWitness>(ts.ctx());

    // Try to unpause group2 with cap1 — should fail
    group2.unpause<TestWitness>(cap1, ts.ctx());

    abort
}

#[test]
fun burn_unpause_cap_makes_pause_permanent() {
    let mut ts = ts::begin(ALICE);

    ts.next_tx(ALICE);
    let mut group = permissioned_group::new<TestWitness>(TestWitness(), ts.ctx());

    let cap: UnpauseCap<TestWitness> = group.pause<TestWitness>(ts.ctx());
    assert!(group.is_paused());

    // Burn the cap — unpause is now impossible
    sui_groups::unpause_cap::burn(cap);

    // Group remains paused
    assert!(group.is_paused());

    destroy(group);
    ts.end();
}
