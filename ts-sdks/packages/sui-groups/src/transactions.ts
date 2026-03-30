// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';

import type { SuiGroupsCall } from './call.js';
import type {
	AddMembersCallOptions,
	GrantPermissionCallOptions,
	GrantPermissionsCallOptions,
	PauseCallOptions,
	RemoveMemberCallOptions,
	RevokePermissionCallOptions,
	RevokePermissionsCallOptions,
	UnpauseCallOptions,
} from './types.js';

export interface SuiGroupsTransactionsOptions {
	call: SuiGroupsCall;
}

/**
 * Transaction factory methods for permissioned groups.
 *
 * Each method returns a complete Transaction object ready for signing.
 * Useful for dapp-kit integration where you need Transaction objects.
 *
 * @example
 * ```ts
 * // For use with dapp-kit's signAndExecuteTransaction
 * const tx = client.groups.tx.grantPermission({
 *   groupId: '0x...',
 *   member: '0x...',
 *   permissionType: '0xabc::my_app::Editor',
 * });
 * signAndExecuteTransaction({ transaction: tx });
 * ```
 */
export class SuiGroupsTransactions {
	#call: SuiGroupsCall;

	constructor(options: SuiGroupsTransactionsOptions) {
		this.#call = options.call;
	}

	// === Permission Management Functions ===

	/**
	 * Creates a Transaction that grants a permission to a member.
	 */
	grantPermission({
		transaction = new Transaction(),
		...options
	}: GrantPermissionCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.grantPermission(options));
		return transaction;
	}

	/**
	 * Creates a Transaction that revokes a permission from a member.
	 */
	revokePermission({
		transaction = new Transaction(),
		...options
	}: RevokePermissionCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.revokePermission(options));
		return transaction;
	}

	// === Batch/Convenience Functions ===

	/**
	 * Creates a Transaction that grants multiple permissions to a member.
	 */
	grantPermissions({
		transaction = new Transaction(),
		...options
	}: GrantPermissionsCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.grantPermissions(options));
		return transaction;
	}

	/**
	 * Creates a Transaction that revokes multiple permissions from a member.
	 */
	revokePermissions({
		transaction = new Transaction(),
		...options
	}: RevokePermissionsCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.revokePermissions(options));
		return transaction;
	}

	/**
	 * Creates a Transaction that adds multiple members with their permissions.
	 */
	addMembers({
		transaction = new Transaction(),
		...options
	}: AddMembersCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.addMembers(options));
		return transaction;
	}

	// === Member Management Functions ===

	/**
	 * Creates a Transaction that removes a member from the group.
	 */
	removeMember({
		transaction = new Transaction(),
		...options
	}: RemoveMemberCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.removeMember(options));
		return transaction;
	}

	// === Group Lifecycle Functions ===

	/**
	 * Creates a Transaction that pauses the group and transfers the
	 * `UnpauseCap` to `unpauseCapRecipient`.
	 *
	 * Unlike the top-level `client.pause()`, this method requires an explicit
	 * recipient because the transaction sender is not yet known at build time.
	 */
	pause({
		transaction = new Transaction(),
		...options
	}: PauseCallOptions & { unpauseCapRecipient: string; transaction?: Transaction }): Transaction {
		transaction.transferObjects(
			[transaction.add(this.#call.pause(options))],
			options.unpauseCapRecipient,
		);
		return transaction;
	}

	/**
	 * Creates a Transaction that unpauses the group.
	 * The `unpauseCapId` must be owned by the signer.
	 */
	unpause({
		transaction = new Transaction(),
		...options
	}: UnpauseCallOptions & { transaction?: Transaction }): Transaction {
		transaction.add(this.#call.unpause(options));
		return transaction;
	}
}
