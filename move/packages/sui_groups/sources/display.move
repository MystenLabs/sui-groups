/// Module: display
///
/// Display support for `PermissionedGroup<T>` types.
///
/// Since `PermissionedGroup<T>` is defined in `permissioned_groups`, extending
/// packages cannot directly create `Display<PermissionedGroup<T>>`.
///
/// ## Solution
///
/// This module provides a shared `PermissionedGroupPublisher` that holds the
/// `permissioned_groups` Publisher. Extending packages can call `setup_display<T>`
/// with their own Publisher to create `Display<PermissionedGroup<T>>`.
///
/// ## Usage
///
/// ```move
/// module my_package::my_module;
///
/// use sui_groups::display::{Self, PermissionedGroupPublisher};
/// use sui::package::{Self, Publisher};
///
/// public struct MY_MODULE() has drop;
/// public struct MyWitness() has drop;
///
/// fun init(otw: MY_MODULE, ctx: &mut TxContext) {
///     let publisher = package::claim(otw, ctx);
///     // Transfer publisher to sender for later use with setup_display
///     transfer::public_transfer(publisher, ctx.sender());
/// }
///
/// /// Call this after init to set up Display for PermissionedGroup<MyWitness>.
/// public fun setup_group_display(
///     pg_publisher: &PermissionedGroupPublisher,
///     publisher: &Publisher,
///     ctx: &mut TxContext,
/// ) {
///     display::setup_display<MyWitness>(
///         pg_publisher,
///         publisher,
///         b"My Group".to_string(),
///         b"A permissioned group".to_string(),
///         b"https://example.com/image.png".to_string(),
///         b"https://example.com".to_string(),
///         b"https://example.com/group/{id}".to_string(),
///         ctx,
///     );
/// }
/// ```
module sui_groups::display;

use sui_groups::permissioned_group::PermissionedGroup;
use std::string::String;
use sui::display;
use sui::package::{Self, Publisher};

// === Error Codes ===

/// Type T is not from the same module as the publisher
const ETypeNotFromModule: u64 = 0;

// === One-Time Witness ===

/// OTW for claiming Publisher and initializing PermissionedGroupPublisher.
public struct DISPLAY() has drop;

// === Structs ===

/// Shared object holding the `permissioned_groups` Publisher.
/// Used by extending packages to create `Display<PermissionedGroup<T>>`.
public struct PermissionedGroupPublisher has key {
    id: UID,
    publisher: Publisher,
}

// === Init ===

fun init(otw: DISPLAY, ctx: &mut TxContext) {
    transfer::share_object(PermissionedGroupPublisher {
        id: object::new(ctx),
        publisher: package::claim(otw, ctx),
    });
}

// === Public Functions ===

/// Creates a `Display<PermissionedGroup<T>>` using the shared publisher.
/// The caller must provide their own Publisher to prove they own the module
/// that defines type T. The Display is transferred to the transaction sender.
///
/// # Type Parameters
/// - `T`: The witness type used with `PermissionedGroup<T>`
///
/// # Parameters
/// - `pg_publisher`: Reference to the shared PermissionedGroupPublisher
/// - `publisher`: Reference to the extending package's Publisher (proves ownership of T)
/// - `name`: Display name template
/// - `description`: Description template
/// - `image_url`: Static image URL for all groups of this type
/// - `project_url`: Project website URL
/// - `link`: Link template for viewing objects, use `{id}` for object ID interpolation
/// - `ctx`: Transaction context
///
/// # Aborts
/// - `ETypeNotFromModule`: if type T is not from the same module as the publisher
#[allow(lint(self_transfer))]
public fun setup_display<T: drop>(
    pg_publisher: &PermissionedGroupPublisher,
    publisher: &Publisher,
    name: String,
    description: String,
    image_url: String,
    project_url: String,
    link: String,
    ctx: &mut TxContext,
) {
    assert!(publisher.from_module<T>(), ETypeNotFromModule);

    let mut display = display::new<PermissionedGroup<T>>(&pg_publisher.publisher, ctx);

    display.add(b"name".to_string(), name);
    display.add(b"description".to_string(), description);
    display.add(b"creator".to_string(), b"{creator}".to_string());
    display.add(b"image_url".to_string(), image_url);
    display.add(b"project_url".to_string(), project_url);
    display.add(b"link".to_string(), link);

    display.update_version();
    transfer::public_transfer(display, ctx.sender());
}

// === Test Helpers ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(DISPLAY(), ctx);
}
