/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Module: permissioned_group
 *
 * Generic permission system for group management.
 *
 * ## Permissions
 *
 * Core permissions (defined in this package):
 *
 * - `PermissionsAdmin`: Manages core permissions. Can grant/revoke
 *   PermissionsAdmin, ExtensionPermissionsAdmin, ObjectAdmin, Destroyer. Can
 *   remove members.
 * - `ExtensionPermissionsAdmin`: Manages extension permissions defined in
 *   third-party packages.
 * - `ObjectAdmin`: Admin-tier permission granting raw `&mut UID` access to the
 *   group object. Use cases include attaching dynamic fields or integrating with
 *   external protocols (e.g. SuiNS reverse lookup). Only accessible via the
 *   actor-object pattern (`object_uid` / `object_uid_mut`), which forces extending
 *   contracts to explicitly reason about the implications of mutating the group
 *   object.
 * - `GroupDeleter`: Permission that allows destroying the group via `delete()`.
 *
 * ## Permission Scoping
 *
 * - `PermissionsAdmin` can ONLY manage core permissions (from this package):
 *   PermissionsAdmin, ExtensionPermissionsAdmin, ObjectAdmin, Destroyer
 * - `ExtensionPermissionsAdmin` can ONLY manage extension permissions (from other
 *   packages)
 *
 * ## Key Concepts
 *
 * - **Membership is defined by permissions**: A member exists if and only if they
 *   have at least one permission
 * - **Granting implicitly adds**: `grant_permission()` will automatically add a
 *   member if they don't exist
 * - **Revoking may remove**: Revoking the last permission automatically removes
 *   the member from the group
 *
 * ## Invariants
 *
 * - At least one `PermissionsAdmin` must always exist
 * - Members always have at least one permission (empty permission sets are not
 *   allowed)
 */

import {
	MoveTuple,
	MoveStruct,
	normalizeMoveArguments,
	type RawTransactionArgument,
} from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as permissions_table from './permissions_table.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = '@local-pkg/sui-groups::permissioned_group';
export const PermissionsAdmin = new MoveTuple({
	name: `${$moduleName}::PermissionsAdmin`,
	fields: [bcs.bool()],
});
export const ExtensionPermissionsAdmin = new MoveTuple({
	name: `${$moduleName}::ExtensionPermissionsAdmin`,
	fields: [bcs.bool()],
});
export const ObjectAdmin = new MoveTuple({
	name: `${$moduleName}::ObjectAdmin`,
	fields: [bcs.bool()],
});
export const GroupDeleter = new MoveTuple({
	name: `${$moduleName}::GroupDeleter`,
	fields: [bcs.bool()],
});
/**
 * Group state mapping addresses to their granted permissions. Parameterized by `T`
 * to scope permissions to a specific package.
 */
export function PermissionedGroup<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::PermissionedGroup<${typeParameters[0].name as T['name']}>`,
		fields: {
			id: bcs.Address,
			/**
			 * Maps member addresses (user or object) to their permission set. Object addresses
			 * enable `object_*` functions for third-party "actor" contracts.
			 */
			permissions: permissions_table.PermissionsTable,
			/** Tracks `PermissionsAdmin` count to enforce at-least-one invariant. */
			permissions_admin_count: bcs.u64(),
			/** Original creator's address */
			creator: bcs.Address,
		},
	});
}
export const PausedMarker = new MoveTuple({
	name: `${$moduleName}::PausedMarker`,
	fields: [bcs.bool()],
});
/** Emitted when a new PermissionedGroup is created via `new`. */
export function GroupCreated<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::GroupCreated<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** ID of the created group. */
			group_id: bcs.Address,
			/** Address of the group creator. */
			creator: bcs.Address,
		},
	});
}
/** Emitted when a new PermissionedGroup is created via `new_derived`. */
export function GroupDerived<T extends BcsType<any>, DerivationKey extends BcsType<any>>(
	...typeParameters: [T, DerivationKey]
) {
	return new MoveStruct({
		name: `${$moduleName}::GroupDerived<${typeParameters[0].name as T['name']}, ${typeParameters[1].name as DerivationKey['name']}>`,
		fields: {
			/** ID of the created group. */
			group_id: bcs.Address,
			/** Address of the group creator. */
			creator: bcs.Address,
			/** ID of the parent object from which the group was derived. */
			parent_id: bcs.Address,
			/** derivation key used. */
			derivation_key: typeParameters[1],
		},
	});
}
/** Emitted when a new member is added to a group via grant_permission. */
export function MemberAdded<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::MemberAdded<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** ID of the group. */
			group_id: bcs.Address,
			/** Address of the new member. */
			member: bcs.Address,
		},
	});
}
/** Emitted when a member is removed from a group. */
export function MemberRemoved<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::MemberRemoved<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** ID of the group. */
			group_id: bcs.Address,
			/** Address of the removed member. */
			member: bcs.Address,
		},
	});
}
/** Emitted when permissions are granted to a member. */
export function PermissionsGranted<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::PermissionsGranted<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** ID of the group. */
			group_id: bcs.Address,
			/** Address of the member receiving the permissions. */
			member: bcs.Address,
			/** Type names of the granted permissions. */
			permissions: bcs.vector(type_name.TypeName),
		},
	});
}
/** Emitted when permissions are revoked from a member. */
export function PermissionsRevoked<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::PermissionsRevoked<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** ID of the group. */
			group_id: bcs.Address,
			/** Address of the member losing the permissions. */
			member: bcs.Address,
			/** Type names of the revoked permissions. */
			permissions: bcs.vector(type_name.TypeName),
		},
	});
}
/** Emitted when a PermissionedGroup is deleted via `delete`. */
export function GroupDeleted<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::GroupDeleted<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** ID of the deleted group. */
			group_id: bcs.Address,
			/** Address of the caller who deleted the group. */
			deleter: bcs.Address,
		},
	});
}
/** Emitted when a PermissionedGroup is paused via `pause`. */
export function GroupPaused<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::GroupPaused<${typeParameters[0].name as T['name']}>`,
		fields: {
			group_id: bcs.Address,
			paused_by: bcs.Address,
		},
	});
}
/** Emitted when a PermissionedGroup is unpaused via `unpause`. */
export function GroupUnpaused<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::GroupUnpaused<${typeParameters[0].name as T['name']}>`,
		fields: {
			group_id: bcs.Address,
			unpaused_by: bcs.Address,
		},
	});
}
export interface NewArguments<T extends BcsType<any>> {
	Witness: RawTransactionArgument<T>;
}
export interface NewOptions<T extends BcsType<any>> {
	package?: string;
	arguments: NewArguments<T> | [Witness: RawTransactionArgument<T>];
	typeArguments: [string];
}
/**
 * Creates a new PermissionedGroup with the sender as initial admin. Grants
 * `PermissionsAdmin`, `ExtensionPermissionsAdmin`, and `Destroyer` to creator.
 *
 * # Type Parameters
 *
 * - `T`: Package witness type to scope permissions
 *
 * # Parameters
 *
 * - `_witness`: Instance of witness type `T` (proves caller owns the type)
 * - `ctx`: Transaction context
 *
 * # Returns
 *
 * A new `PermissionedGroup<T>` with sender having `PermissionsAdmin` and
 * `ExtensionPermissionsAdmin`.
 */
export function _new<T extends BcsType<any>>(options: NewOptions<T>) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [`${options.typeArguments[0]}`] satisfies (string | null)[];
	const parameterNames = ['Witness'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'new',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface NewDerivedArguments<T extends BcsType<any>, DerivationKey extends BcsType<any>> {
	Witness: RawTransactionArgument<T>;
	derivationUid: RawTransactionArgument<string>;
	derivationKey: RawTransactionArgument<DerivationKey>;
}
export interface NewDerivedOptions<T extends BcsType<any>, DerivationKey extends BcsType<any>> {
	package?: string;
	arguments:
		| NewDerivedArguments<T, DerivationKey>
		| [
				Witness: RawTransactionArgument<T>,
				derivationUid: RawTransactionArgument<string>,
				derivationKey: RawTransactionArgument<DerivationKey>,
		  ];
	typeArguments: [string, string];
}
/**
 * Creates a new derived PermissionedGroup with deterministic address. Grants
 * `PermissionsAdmin`, `ExtensionPermissionsAdmin`, and `Destroyer` to creator.
 *
 * # Type Parameters
 *
 * - `T`: Package witness type to scope permissions
 * - `DerivationKey`: Key type for address derivation
 *
 * # Parameters
 *
 * - `_witness`: Instance of witness type `T` (proves caller owns the type)
 * - `derivation_uid`: Mutable reference to the parent UID for derivation
 * - `derivation_key`: Key used for deterministic address derivation
 * - `ctx`: Transaction context
 *
 * # Returns
 *
 * A new `PermissionedGroup<T>` with derived address.
 *
 * # Aborts
 *
 * - `EPermissionedGroupAlreadyExists`: if derived address is already claimed
 */
export function newDerived<T extends BcsType<any>, DerivationKey extends BcsType<any>>(
	options: NewDerivedOptions<T, DerivationKey>,
) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [
		`${options.typeArguments[0]}`,
		'0x2::object::ID',
		`${options.typeArguments[1]}`,
	] satisfies (string | null)[];
	const parameterNames = ['Witness', 'derivationUid', 'derivationKey'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'new_derived',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface DeleteArguments {
	self: RawTransactionArgument<string>;
}
export interface DeleteOptions {
	package?: string;
	arguments: DeleteArguments | [self: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Deletes a PermissionedGroup, returning its components. Checks that
 * `ctx.sender()` has `GroupDeleter` permission. Caller must extract any dynamic
 * fields BEFORE calling this (the UID is deleted).
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 *
 * # Parameters
 *
 * - `self`: The PermissionedGroup to delete (by value)
 * - `ctx`: Transaction context
 *
 * # Returns
 *
 * Tuple of (PermissionsTable, permissions_admin_count, creator)
 *
 * # Aborts
 *
 * - `ENotPermitted`: if caller doesn't have `GroupDeleter` permission
 */
export function _delete(options: DeleteOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'delete',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface PauseArguments {
	self: RawTransactionArgument<string>;
}
export interface PauseOptions {
	package?: string;
	arguments: PauseArguments | [self: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Pauses the group, preventing all mutations. Returns an `UnpauseCap<T>` that is
 * required to unpause.
 *
 * To use as an emergency fix: pause → fix state in a PTB → unpause. To archive
 * (messaging layer): pause → store the returned cap as a DOF.
 *
 * # Aborts
 *
 * - `ENotPermitted`: if caller doesn't have `PermissionsAdmin`
 * - `EAlreadyPaused`: if the group is already paused
 */
export function pause(options: PauseOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'pause',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface UnpauseArguments {
	self: RawTransactionArgument<string>;
	cap: RawTransactionArgument<string>;
}
export interface UnpauseOptions {
	package?: string;
	arguments:
		| UnpauseArguments
		| [self: RawTransactionArgument<string>, cap: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Unpauses the group. Consumes and destroys the `UnpauseCap`.
 *
 * # Aborts
 *
 * - `EGroupIdMismatch`: if the cap belongs to a different group
 */
export function unpause(options: UnpauseOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, null] satisfies (string | null)[];
	const parameterNames = ['self', 'cap'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'unpause',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface IsPausedArguments {
	self: RawTransactionArgument<string>;
}
export interface IsPausedOptions {
	package?: string;
	arguments: IsPausedArguments | [self: RawTransactionArgument<string>];
	typeArguments: [string];
}
/** Returns whether the group is currently paused. */
export function isPaused(options: IsPausedOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'is_paused',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface GrantPermissionArguments {
	self: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface GrantPermissionOptions {
	package?: string;
	arguments:
		| GrantPermissionArguments
		| [self: RawTransactionArgument<string>, member: RawTransactionArgument<string>];
	typeArguments: [string, string];
}
/**
 * Grants a permission to a member. If the member doesn't exist, they are
 * automatically added to the group. Emits both `MemberAdded` (if new) and
 * `PermissionsGranted` events.
 *
 * Permission requirements:
 *
 * - Core permissions: caller must have `PermissionsAdmin`
 * - Extension permissions: caller must have `ExtensionPermissionsAdmin`
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 * - `NewPermission`: Permission type to grant
 *
 * # Parameters
 *
 * - `self`: Mutable reference to the PermissionedGroup
 * - `member`: Address of the member to grant permission to
 * - `ctx`: Transaction context
 *
 * # Aborts
 *
 * - `ENotPermitted`: if caller doesn't have appropriate manager permission
 */
export function grantPermission(options: GrantPermissionOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'grant_permission',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ObjectGrantPermissionArguments {
	self: RawTransactionArgument<string>;
	actorObject: RawTransactionArgument<string>;
	recipient: RawTransactionArgument<string>;
}
export interface ObjectGrantPermissionOptions {
	package?: string;
	arguments:
		| ObjectGrantPermissionArguments
		| [
				self: RawTransactionArgument<string>,
				actorObject: RawTransactionArgument<string>,
				recipient: RawTransactionArgument<string>,
		  ];
	typeArguments: [string, string];
}
/**
 * Grants a permission to a recipient via an actor object. Enables third-party
 * contracts to grant permissions with custom logic. If the recipient is not
 * already a member, they are automatically added.
 *
 * Permission requirements:
 *
 * - Core permissions: actor must have `PermissionsAdmin`
 * - Extension permissions: actor must have `ExtensionPermissionsAdmin`
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 * - `NewPermission`: Permission type to grant
 *
 * # Parameters
 *
 * - `self`: Mutable reference to the PermissionedGroup
 * - `actor_object`: UID of the actor object with appropriate manager permission
 * - `recipient`: Address of the member to receive the permission
 *
 * # Aborts
 *
 * - `ENotPermitted`: if actor_object doesn't have appropriate manager permission
 */
export function objectGrantPermission(options: ObjectGrantPermissionOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, '0x2::object::ID', 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'actorObject', 'recipient'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'object_grant_permission',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface RemoveMemberArguments {
	self: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface RemoveMemberOptions {
	package?: string;
	arguments:
		| RemoveMemberArguments
		| [self: RawTransactionArgument<string>, member: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Removes a member from the PermissionedGroup. Requires `PermissionsAdmin`
 * permission as this is a powerful admin operation.
 *
 * # Parameters
 *
 * - `self`: Mutable reference to the PermissionedGroup
 * - `member`: Address of the member to remove
 * - `ctx`: Transaction context
 *
 * # Aborts
 *
 * - `ENotPermitted`: if caller doesn't have `PermissionsAdmin` permission
 * - `EMemberNotFound`: if member doesn't exist
 * - `ELastPermissionsAdmin`: if removing would leave no PermissionsAdmins
 */
export function removeMember(options: RemoveMemberOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'remove_member',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ObjectRemoveMemberArguments {
	self: RawTransactionArgument<string>;
	actorObject: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface ObjectRemoveMemberOptions {
	package?: string;
	arguments:
		| ObjectRemoveMemberArguments
		| [
				self: RawTransactionArgument<string>,
				actorObject: RawTransactionArgument<string>,
				member: RawTransactionArgument<string>,
		  ];
	typeArguments: [string];
}
/**
 * Removes a member from the group via an actor object. Enables third-party
 * contracts to implement custom leave logic. The actor object must have
 * `PermissionsAdmin` permission on the group.
 *
 * # Parameters
 *
 * - `self`: Mutable reference to the PermissionedGroup
 * - `actor_object`: UID of the actor object with `PermissionsAdmin` permission
 * - `member`: Address of the member to remove
 *
 * # Aborts
 *
 * - `ENotPermitted`: if actor_object doesn't have `PermissionsAdmin` permission
 * - `EMemberNotFound`: if member is not a member
 * - `ELastPermissionsAdmin`: if removing would leave no PermissionsAdmins
 */
export function objectRemoveMember(options: ObjectRemoveMemberOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, '0x2::object::ID', 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'actorObject', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'object_remove_member',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface RevokePermissionArguments {
	self: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface RevokePermissionOptions {
	package?: string;
	arguments:
		| RevokePermissionArguments
		| [self: RawTransactionArgument<string>, member: RawTransactionArgument<string>];
	typeArguments: [string, string];
}
/**
 * Revokes a permission from a member. If this is the member's last permission,
 * they are automatically removed from the group. Emits `PermissionsRevoked` and
 * potentially `MemberRemoved` events.
 *
 * Permission requirements:
 *
 * - Core permissions: caller must have `PermissionsAdmin`
 * - Extension permissions: caller must have `ExtensionPermissionsAdmin`
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 * - `ExistingPermission`: Permission type to revoke
 *
 * # Parameters
 *
 * - `self`: Mutable reference to the PermissionedGroup
 * - `member`: Address of the member to revoke permission from
 * - `ctx`: Transaction context
 *
 * # Aborts
 *
 * - `ENotPermitted`: if caller doesn't have appropriate manager permission
 * - `EMemberNotFound`: if member doesn't exist
 * - `ELastPermissionsAdmin`: if revoking `PermissionsAdmin` would leave no admins
 */
export function revokePermission(options: RevokePermissionOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'revoke_permission',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ObjectRevokePermissionArguments {
	self: RawTransactionArgument<string>;
	actorObject: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface ObjectRevokePermissionOptions {
	package?: string;
	arguments:
		| ObjectRevokePermissionArguments
		| [
				self: RawTransactionArgument<string>,
				actorObject: RawTransactionArgument<string>,
				member: RawTransactionArgument<string>,
		  ];
	typeArguments: [string, string];
}
/**
 * Revokes a permission from a member via an actor object. Enables third-party
 * contracts to revoke permissions with custom logic. If this is the member's last
 * permission, they are automatically removed from the group.
 *
 * Permission requirements:
 *
 * - Core permissions: actor must have `PermissionsAdmin`
 * - Extension permissions: actor must have `ExtensionPermissionsAdmin`
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 * - `ExistingPermission`: Permission type to revoke
 *
 * # Parameters
 *
 * - `self`: Mutable reference to the PermissionedGroup
 * - `actor_object`: UID of the actor object with appropriate manager permission
 * - `member`: Address of the member to revoke permission from
 *
 * # Aborts
 *
 * - `ENotPermitted`: if actor_object doesn't have appropriate manager permission
 * - `EMemberNotFound`: if member is not a member
 * - `ELastPermissionsAdmin`: if revoking `PermissionsAdmin` would leave no admins
 */
export function objectRevokePermission(options: ObjectRevokePermissionOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, '0x2::object::ID', 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'actorObject', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'object_revoke_permission',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface HasPermissionArguments {
	self: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface HasPermissionOptions {
	package?: string;
	arguments:
		| HasPermissionArguments
		| [self: RawTransactionArgument<string>, member: RawTransactionArgument<string>];
	typeArguments: [string, string];
}
/**
 * Checks if the given address has the specified permission.
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 * - `Permission`: Permission type to check
 *
 * # Parameters
 *
 * - `self`: Reference to the PermissionedGroup
 * - `member`: Address to check
 *
 * # Returns
 *
 * `true` if the address has the permission, `false` otherwise.
 */
export function hasPermission(options: HasPermissionOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'has_permission',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface IsMemberArguments {
	self: RawTransactionArgument<string>;
	member: RawTransactionArgument<string>;
}
export interface IsMemberOptions {
	package?: string;
	arguments:
		| IsMemberArguments
		| [self: RawTransactionArgument<string>, member: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Checks if the given address is a member of the group.
 *
 * # Type Parameters
 *
 * - `T`: Package witness type
 *
 * # Parameters
 *
 * - `self`: Reference to the PermissionedGroup
 * - `member`: Address to check
 *
 * # Returns
 *
 * `true` if the address is a member, `false` otherwise.
 */
export function isMember(options: IsMemberOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, 'address'] satisfies (string | null)[];
	const parameterNames = ['self', 'member'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'is_member',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface CreatorArguments {
	self: RawTransactionArgument<string>;
}
export interface CreatorOptions {
	package?: string;
	arguments: CreatorArguments | [self: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Returns the creator's address of the PermissionedGroup.
 *
 * # Parameters
 *
 * - `self`: Reference to the PermissionedGroup
 *
 * # Returns
 *
 * The address of the creator.
 */
export function creator(options: CreatorOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'creator',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ObjectUidArguments {
	self: RawTransactionArgument<string>;
	actorObject: RawTransactionArgument<string>;
}
export interface ObjectUidOptions {
	package?: string;
	arguments:
		| ObjectUidArguments
		| [self: RawTransactionArgument<string>, actorObject: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Returns a reference to the group's UID via an actor object. The actor object
 * must have `ObjectAdmin` permission on the group. Only accessible via the
 * actor-object pattern — use this to build wrapper modules that explicitly reason
 * about the implications of accessing the group UID.
 *
 * # Aborts
 *
 * - `ENotPermitted`: if actor_object doesn't have `ObjectAdmin` permission
 */
export function objectUid(options: ObjectUidOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, '0x2::object::ID'] satisfies (string | null)[];
	const parameterNames = ['self', 'actorObject'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'object_uid',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ObjectUidMutArguments {
	self: RawTransactionArgument<string>;
	actorObject: RawTransactionArgument<string>;
}
export interface ObjectUidMutOptions {
	package?: string;
	arguments:
		| ObjectUidMutArguments
		| [self: RawTransactionArgument<string>, actorObject: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Returns a mutable reference to the group's UID via an actor object. The actor
 * object must have `ObjectAdmin` permission on the group. Only accessible via the
 * actor-object pattern — use this to build wrapper modules that explicitly reason
 * about the implications of mutating the group UID.
 *
 * # Aborts
 *
 * - `ENotPermitted`: if actor_object doesn't have `ObjectAdmin` permission
 */
export function objectUidMut(options: ObjectUidMutOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null, '0x2::object::ID'] satisfies (string | null)[];
	const parameterNames = ['self', 'actorObject'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'object_uid_mut',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface PermissionsAdminCountArguments {
	self: RawTransactionArgument<string>;
}
export interface PermissionsAdminCountOptions {
	package?: string;
	arguments: PermissionsAdminCountArguments | [self: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Returns the number of `PermissionsAdmin`s in the PermissionedGroup.
 *
 * # Parameters
 *
 * - `self`: Reference to the PermissionedGroup
 *
 * # Returns
 *
 * The count of `PermissionsAdmin`s.
 */
export function permissionsAdminCount(options: PermissionsAdminCountOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'permissions_admin_count',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface MemberCountArguments {
	self: RawTransactionArgument<string>;
}
export interface MemberCountOptions {
	package?: string;
	arguments: MemberCountArguments | [self: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Returns the total number of members in the PermissionedGroup.
 *
 * # Parameters
 *
 * - `self`: Reference to the PermissionedGroup
 *
 * # Returns
 *
 * The total number of members.
 */
export function memberCount(options: MemberCountOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissioned_group',
			function: 'member_count',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
