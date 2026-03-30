#[test_only]
module sui_groups::display_tests;

use sui_groups::display::{Self, PermissionedGroupPublisher};
use sui_groups::permissioned_group::PermissionedGroup;
use sui::display::Display;
use sui::package;
use sui::test_scenario as ts;

// === Test Addresses ===

const ALICE: address = @0xA11CE;

// === One-Time Witness ===

/// OTW used to claim a Publisher for this test module.
/// Must be ALL_CAPS and match the module name: DISPLAY_TESTS.
public struct DISPLAY_TESTS() has drop;

// === Test Helpers ===

#[test_only]
fun init_for_testing(otw: DISPLAY_TESTS, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);
    transfer::public_transfer(publisher, ctx.sender());
}

// === Tests ===

#[test]
fun setup_display_creates_display_object() {
    let mut ts = ts::begin(ALICE);

    // Initialize PermissionedGroupPublisher (shares it)
    ts.next_tx(ALICE);
    display::init_for_testing(ts.ctx());

    // Claim a Publisher for this test module
    ts.next_tx(ALICE);
    init_for_testing(DISPLAY_TESTS(), ts.ctx());

    // Call setup_display — should create a Display<PermissionedGroup<DISPLAY_TESTS>>
    ts.next_tx(ALICE);
    let pg_publisher = ts.take_shared<PermissionedGroupPublisher>();
    let publisher = ts.take_from_sender<sui::package::Publisher>();

    display::setup_display<DISPLAY_TESTS>(
        &pg_publisher,
        &publisher,
        b"Test Group".to_string(),
        b"A test group".to_string(),
        b"https://example.com/image.png".to_string(),
        b"https://example.com".to_string(),
        b"https://example.com/group/{id}".to_string(),
        ts.ctx(),
    );

    ts::return_shared(pg_publisher);
    ts.return_to_sender(publisher);

    // Verify the Display object was transferred to ALICE
    ts.next_tx(ALICE);
    let d = ts.take_from_sender<Display<PermissionedGroup<DISPLAY_TESTS>>>();
    ts.return_to_sender(d);

    ts.end();
}

#[test, expected_failure(abort_code = sui_groups::display::ETypeNotFromModule)]
fun setup_display_wrong_publisher_fails() {
    let mut ts = ts::begin(ALICE);

    // Initialize PermissionedGroupPublisher
    ts.next_tx(ALICE);
    display::init_for_testing(ts.ctx());

    // Claim a Publisher for the display_tests module
    ts.next_tx(ALICE);
    init_for_testing(DISPLAY_TESTS(), ts.ctx());

    // Try to create Display<PermissionedGroup<PermissionsAdmin>> using the display_tests publisher.
    // This fails because PermissionsAdmin is from the permissioned_group module,
    // not from the display_tests module that issued the publisher.
    ts.next_tx(ALICE);
    let pg_publisher = ts.take_shared<PermissionedGroupPublisher>();
    let publisher = ts.take_from_sender<sui::package::Publisher>();

    display::setup_display<sui_groups::permissioned_group::PermissionsAdmin>(
        &pg_publisher,
        &publisher,
        b"Bad Group".to_string(),
        b"Should fail".to_string(),
        b"https://example.com/image.png".to_string(),
        b"https://example.com".to_string(),
        b"https://example.com/group/{id}".to_string(),
        ts.ctx(),
    );

    abort
}
