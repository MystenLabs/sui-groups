// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { Transaction, TransactionResult } from '@mysten/sui/transactions';

import * as permissionedGroup from './contracts/sui_groups/permissioned_group.js';
import type {
	AddMembersCallOptions,
	DeleteCallOptions,
	GrantPermissionCallOptions,
	GrantPermissionsCallOptions,
	PauseCallOptions,
	SuiGroupsPackageConfig,
	RemoveMemberCallOptions,
	RevokePermissionCallOptions,
	RevokePermissionsCallOptions,
	UnpauseCallOptions,
} from './types.js';

export interface SuiGroupsCallOptions {
	packageConfig: SuiGroupsPackageConfig;
	witnessType: string;
}

/**
 * Low-level transaction building methods for permissioned groups.
 *
 * Each method returns a thunk `(tx: Transaction) => TransactionResult`
 * that can be composed with other transaction operations.
 *
 * @example
 * ```ts
 * const tx = new Transaction();
 * tx.add(client.groups.call.grantPermission({
 *   groupId: '0x...',
 *   member: '0x...',
 *   permissionType: '0xabc::my_app::Editor',
 * }));
 * ```
 */
export class SuiGroupsCall {
	#packageConfig: SuiGroupsPackageConfig;
	#witnessType: string;

	constructor(options: SuiGroupsCallOptions) {
		this.#packageConfig = options.packageConfig;
		this.#witnessType = options.witnessType;
	}

	// === Permission Management Functions ===

	/**
	 * Grants a permission to a member.
	 * If the member doesn't exist, they are automatically added to the group.
	 *
	 * Permission requirements:
	 * - To grant PermissionsAdmin: caller must have PermissionsAdmin
	 * - To grant any other permission: caller must have PermissionsAdmin OR ExtensionPermissionsAdmin
	 */
	grantPermission(options: GrantPermissionCallOptions): (tx: Transaction) => TransactionResult {
		return permissionedGroup.grantPermission({
			package: this.#packageConfig.latestPackageId,
			arguments: {
				self: options.groupId,
				member: options.member,
			},
			typeArguments: [this.#witnessType, options.permissionType],
		});
	}

	/**
	 * Revokes a permission from a member.
	 * If this is the member's last permission, they are automatically removed.
	 *
	 * Permission requirements:
	 * - To revoke PermissionsAdmin: caller must have PermissionsAdmin
	 * - To revoke any other permission: caller must have PermissionsAdmin OR ExtensionPermissionsAdmin
	 */
	revokePermission(options: RevokePermissionCallOptions): (tx: Transaction) => TransactionResult {
		return permissionedGroup.revokePermission({
			package: this.#packageConfig.latestPackageId,
			arguments: {
				self: options.groupId,
				member: options.member,
			},
			typeArguments: [this.#witnessType, options.permissionType],
		});
	}

	// === Batch/Convenience Functions ===

	/**
	 * Grants multiple permissions to a member in a single transaction.
	 * If the member doesn't exist, they are automatically added on the first grant.
	 */
	grantPermissions(options: GrantPermissionsCallOptions): (tx: Transaction) => void {
		return (tx: Transaction) => {
			for (const permType of options.permissionTypes) {
				tx.add(
					this.grantPermission({
						groupId: options.groupId,
						member: options.member,
						permissionType: permType,
					}),
				);
			}
		};
	}

	/**
	 * Revokes multiple permissions from a member in a single transaction.
	 * If the last permission is revoked, the member is automatically removed.
	 */
	revokePermissions(options: RevokePermissionsCallOptions): (tx: Transaction) => void {
		return (tx: Transaction) => {
			for (const permType of options.permissionTypes) {
				tx.add(
					this.revokePermission({
						groupId: options.groupId,
						member: options.member,
						permissionType: permType,
					}),
				);
			}
		};
	}

	/**
	 * Adds multiple members to a group, each with their own set of permissions.
	 * Members who already exist will simply receive the additional permissions.
	 */
	addMembers(options: AddMembersCallOptions): (tx: Transaction) => void {
		return (tx: Transaction) => {
			for (const member of options.members) {
				for (const permType of member.permissions) {
					tx.add(
						this.grantPermission({
							groupId: options.groupId,
							member: member.address,
							permissionType: permType,
						}),
					);
				}
			}
		};
	}

	// === Member Management Functions ===

	/**
	 * Removes a member from the PermissionedGroup.
	 * Requires PermissionsAdmin permission.
	 */
	removeMember(options: RemoveMemberCallOptions): (tx: Transaction) => TransactionResult {
		return permissionedGroup.removeMember({
			package: this.#packageConfig.latestPackageId,
			arguments: {
				self: options.groupId,
				member: options.member,
			},
			typeArguments: [this.#witnessType],
		});
	}

	// === Group Lifecycle Functions ===

	/**
	 * Pauses the group, preventing all mutations.
	 * Returns an `UnpauseCap<T>` that is required to unpause.
	 *
	 * NOTE: This returns an `UnpauseCap` object that must be handled in the same
	 * transaction (e.g., transferred to the caller or stored as a dynamic field).
	 * Use `tx.transferObjects` or a custom PTB step after calling this.
	 *
	 * Permission requirements: caller must have PermissionsAdmin.
	 */
	pause(options: PauseCallOptions): (tx: Transaction) => TransactionResult {
		return permissionedGroup.pause({
			package: this.#packageConfig.latestPackageId,
			arguments: {
				self: options.groupId,
			},
			typeArguments: [this.#witnessType],
		});
	}

	/**
	 * Unpauses the group. Consumes and destroys the `UnpauseCap`.
	 *
	 * @param options.unpauseCapId - The object ID or TransactionArgument of the UnpauseCap
	 */
	unpause(options: UnpauseCallOptions): (tx: Transaction) => TransactionResult {
		return permissionedGroup.unpause({
			package: this.#packageConfig.latestPackageId,
			arguments: {
				self: options.groupId,
				cap: options.unpauseCapId,
			},
			typeArguments: [this.#witnessType],
		});
	}

	/**
	 * Deletes the group, returning its components as a PTB tuple.
	 *
	 * NOTE: `delete` returns `(PermissionsTable, u64, address)` from Move.
	 * There is no high-level imperative variant — callers must compose this with
	 * additional PTB steps to handle the returned PermissionsTable
	 * (e.g., `permissions_table::destroy_empty`). This is intentional: only
	 * an extending contract that knows about any dynamic fields on the group
	 * can safely complete the deletion.
	 *
	 * Permission requirements: caller must have GroupDeleter permission.
	 */
	delete(options: DeleteCallOptions): (tx: Transaction) => TransactionResult {
		return permissionedGroup._delete({
			package: this.#packageConfig.latestPackageId,
			arguments: {
				self: options.groupId,
			},
			typeArguments: [this.#witnessType],
		});
	}
}
