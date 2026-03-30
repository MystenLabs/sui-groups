/// Tests for the example_group module.
/// Demonstrates the patterns from the example and ensures they work correctly.
#[test_only]
module example_group::example_group_tests;

use example_group::example_group;
use sui_groups::permissioned_group::{Self, PermissionedGroup, ExtensionPermissionsAdmin};
use sui::test_scenario as ts;
use std::unit_test::assert_eq;

const ADMIN: address = @0xAD;
const USER: address = @0xBEEF;

// === Group Creation Tests ===

#[test]
fun create_group_works() {
    let mut ts = ts::begin(ADMIN);

    ts.next_tx(ADMIN);
    let group = example_group::create_group(ts.ctx());

    assert_eq!(group.is_member(ADMIN), true);
    transfer::public_share_object(group);

    ts.end();
}

#[test]
fun create_derived_group_works() {
    let mut ts = ts::begin(ADMIN);

    ts.next_tx(ADMIN);
    let mut parent_uid = object::new(ts.ctx());
    let group = example_group::create_derived_group(
        &mut parent_uid,
        b"example-group-key",
        ts.ctx(),
    );

    assert_eq!(group.is_member(ADMIN), true);
    transfer::public_share_object(group);
    parent_uid.delete();

    ts.end();
}

// === Self-Service Actor Tests ===

#[test]
fun join_actor_self_service_join_works() {
    let mut ts = ts::begin(ADMIN);

    // Admin creates group + actor, grants ExtensionPermissionsAdmin to actor
    ts.next_tx(ADMIN);
    let mut group = example_group::create_group(ts.ctx());
    let group_id = object::id(&group);
    let actor = example_group::new_join_actor(group_id, ts.ctx());
    let actor_addr = example_group::join_actor_address(&actor);

    group.grant_permission<example_group::ExampleGroupWitness, ExtensionPermissionsAdmin>(
        actor_addr,
        ts.ctx(),
    );

    transfer::public_share_object(group);
    example_group::share_join_actor(actor);

    // User joins via actor
    ts.next_tx(USER);
    let mut group = ts.take_shared<PermissionedGroup<example_group::ExampleGroupWitness>>();
    let actor = ts.take_shared<example_group::JoinActor>();

    example_group::join(&actor, &mut group, ts.ctx());
    assert_eq!(group.is_member(USER), true);
    assert_eq!(
        group.has_permission<example_group::ExampleGroupWitness, example_group::CustomMemberPermission>(USER),
        true,
    );

    ts::return_shared(group);
    ts::return_shared(actor);
    ts.end();
}

#[test]
fun join_then_leave_works() {
    let mut ts = ts::begin(ADMIN);

    ts.next_tx(ADMIN);
    let mut group = example_group::create_group(ts.ctx());
    let group_id = object::id(&group);
    let actor = example_group::new_join_actor(group_id, ts.ctx());
    let actor_addr = example_group::join_actor_address(&actor);

    group.grant_permission<example_group::ExampleGroupWitness, ExtensionPermissionsAdmin>(
        actor_addr,
        ts.ctx(),
    );

    transfer::public_share_object(group);
    example_group::share_join_actor(actor);

    // User joins
    ts.next_tx(USER);
    let mut group = ts.take_shared<PermissionedGroup<example_group::ExampleGroupWitness>>();
    let actor = ts.take_shared<example_group::JoinActor>();
    example_group::join(&actor, &mut group, ts.ctx());
    assert_eq!(group.is_member(USER), true);
    ts::return_shared(group);
    ts::return_shared(actor);

    // User leaves
    ts.next_tx(USER);
    let mut group = ts.take_shared<PermissionedGroup<example_group::ExampleGroupWitness>>();
    let actor = ts.take_shared<example_group::JoinActor>();
    example_group::leave(&actor, &mut group, ts.ctx());
    assert_eq!(group.is_member(USER), false);
    ts::return_shared(group);
    ts::return_shared(actor);

    ts.end();
}

#[test, expected_failure(abort_code = permissioned_group::ENotPermitted)]
fun join_without_actor_permission_fails() {
    let mut ts = ts::begin(ADMIN);

    ts.next_tx(ADMIN);
    let mut group = example_group::create_group(ts.ctx());
    let group_id = object::id(&group);
    let actor = example_group::new_join_actor(group_id, ts.ctx());
    let actor_addr = example_group::join_actor_address(&actor);

    // Grant actor CustomMemberPermission (insufficient — needs ExtensionPermissionsAdmin)
    group.grant_permission<example_group::ExampleGroupWitness, example_group::CustomMemberPermission>(
        actor_addr,
        ts.ctx(),
    );

    transfer::public_share_object(group);
    example_group::share_join_actor(actor);

    // User tries to join (should fail — actor lacks ExtensionPermissionsAdmin)
    ts.next_tx(USER);
    let mut group = ts.take_shared<PermissionedGroup<example_group::ExampleGroupWitness>>();
    let actor = ts.take_shared<example_group::JoinActor>();
    example_group::join(&actor, &mut group, ts.ctx());

    abort
}
