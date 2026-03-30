/// Module: unpause_cap
///
/// Capability required to unpause a `PermissionedGroup<T>`.
/// Returned by `permissioned_group::pause()`.
///
/// The phantom `T` scopes the cap to the group's package type —
/// a cap from one package's group cannot unpause a different package's group.
///
/// ## Usage
///
/// **Emergency fix pattern (PTB):**
/// ```
/// let cap = group.pause(ctx);
/// // fix permissions in the same PTB
/// group.unpause(cap, ctx);
/// ```
///
/// **Archive pattern (messaging layer):**
/// ```
/// // get uid before pausing
/// let uid = group.object_uid_mut(&group_manager.id);
/// // attach ArchiveStamp as a permanent marker
/// dynamic_field::add(uid, ArchiveStamp(), true);
/// // pause and immediately burn the cap — unpause is now impossible
/// let cap = group.pause(ctx);
/// unpause_cap::burn(cap);
/// // Alternative: transfer::public_freeze_object(cap)
/// //   — makes the cap immutable and un-passable by value
/// ```
module sui_groups::unpause_cap;

// === Structs ===

/// Owned capability required to unpause a `PermissionedGroup<T>`.
/// Has `store` so it can be wrapped or stored as a dynamic object field.
public struct UnpauseCap<phantom T> has key, store {
    id: UID,
    /// ID of the group this cap belongs to.
    /// Checked in `permissioned_group::unpause()` to prevent cross-group misuse.
    group_id: ID,
}

// === Package Functions ===

/// Creates a new `UnpauseCap` for the given group.
/// Called exclusively by `permissioned_group::pause()`.
public(package) fun new<T>(group_id: ID, ctx: &mut TxContext): UnpauseCap<T> {
    UnpauseCap { id: object::new(ctx), group_id }
}

/// Returns the group ID this cap belongs to.
/// Used by `permissioned_group::unpause()` for mismatch check.
public(package) fun group_id<T>(cap: &UnpauseCap<T>): ID {
    cap.group_id
}

/// Deletes the cap's UID, consuming it without unpausing.
/// Package-internal: only `permissioned_group::unpause()` should call this.
public(package) fun delete<T>(cap: UnpauseCap<T>) {
    let UnpauseCap { id, .. } = cap;
    id.delete();
}

// === Public Functions ===

/// Burns the cap, making the group's pause permanent.
/// Call this to archive a group — once burned, unpause is impossible.
///
/// Alternative: `transfer::public_freeze_object(cap)` — makes the cap immutable
/// (cannot be passed by value to `unpause()`), also preventing unpause without destroying it.
public fun burn<T>(cap: UnpauseCap<T>) {
    let UnpauseCap { id, .. } = cap;
    id.delete();
}
