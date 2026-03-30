/// Module: permissions_table
///
/// Internal data structure for storing member permissions.
/// Maps `address -> VecSet<TypeName>` using dynamic fields on a derived object.
/// Created as a child of `PermissionedGroup` for easy discoverability.
module sui_groups::permissions_table;

use std::string::String;
use std::type_name::TypeName;
use sui::derived_object;
use sui::dynamic_field as field;
use sui::vec_set::VecSet;

// === Error Codes ===

/// Attempted to derive a PermissionsTable that already exists for the given parent.
const EPermissionsTableAlreadyExists: u64 = 0;
/// Attempted to destroy a PermissionsTable that still has members.
const EPermissionsTableNotEmpty: u64 = 1;

// === Structs ===

/// A PermissionsTable is a derived object from a parent PermissionedGroup,
/// that holds all the `address -> VecSet<TypeName>` mappings for permissions.
/// The permissions are stored as dynamic fields.
/// This enables easy discoverability, given a PermissionedGroup ID.
public struct PermissionsTable has key, store {
    id: UID,
    length: u64,
}

// === Package Functions ===

/// Creates a new `PermissionsTable` derived from the given parent UID.
///
/// # Aborts
/// - `EPermissionsTableAlreadyExists`: if a table already exists for this derivation key
public(package) fun new_derived(parent_uid: &mut UID, derivation_key: String): PermissionsTable {
    assert!(!derived_object::exists(parent_uid, derivation_key), EPermissionsTableAlreadyExists);
    PermissionsTable {
        id: derived_object::claim(parent_uid, derivation_key),
        length: 0,
    }
}

/// Adds a new member with the given initial permission set.
/// Stores the mapping as a dynamic field keyed by the member's address.
public(package) fun add_member(
    self: &mut PermissionsTable,
    member: address,
    initial_permissions: VecSet<TypeName>,
) {
    field::add(
        &mut self.id,
        member,
        initial_permissions,
    );
    self.length = self.length + 1;
}

/// Removes a member and their entire permission set from the table.
public(package) fun remove_member(self: &mut PermissionsTable, member: address) {
    let _permissions_entry = field::remove<address, VecSet<TypeName>>(&mut self.id, member);
    self.length = self.length - 1;
}

/// Adds a permission to an existing member's permission set.
public(package) fun add_permission(
    self: &mut PermissionsTable,
    member: address,
    permission: TypeName,
) {
    let permissions = field::borrow_mut<address, VecSet<TypeName>>(&mut self.id, member);
    permissions.insert(permission);
}

/// Removes a permission from a member's set and returns the remaining permissions.
/// Useful for checking if the member should be removed (empty set).
public(package) fun remove_permission(
    self: &mut PermissionsTable,
    member: address,
    permission: &TypeName,
): &VecSet<TypeName> {
    let permissions = field::borrow_mut<address, VecSet<TypeName>>(&mut self.id, member);
    permissions.remove(permission);
    permissions
}

/// Returns whether a member has the specified permission.
public(package) fun has_permission(
    self: &PermissionsTable,
    member: address,
    permission: &TypeName,
): bool {
    if (!field::exists_(&self.id, member)) {
        return false
    };
    let permissions = field::borrow<address, VecSet<TypeName>>(&self.id, member);
    permissions.contains(permission)
}

/// Returns whether the given address is a member (has a dynamic field entry).
public(package) fun is_member(self: &PermissionsTable, member: address): bool {
    field::exists_with_type<address, VecSet<TypeName>>(&self.id, member)
}

/// Returns the number of members in the table.
public(package) fun length(self: &PermissionsTable): u64 {
    self.length
}

/// Destroys an empty PermissionsTable.
///
/// # Aborts
/// - `EPermissionsTableNotEmpty`: if the table still has members
public fun destroy_empty(self: PermissionsTable) {
    let PermissionsTable { id, length } = self;
    assert!(length == 0, EPermissionsTableNotEmpty);
    id.delete();
}
