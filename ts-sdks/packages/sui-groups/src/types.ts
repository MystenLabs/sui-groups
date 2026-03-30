// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { Signer } from '@mysten/sui/cryptography';
import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { TransactionArgument } from '@mysten/sui/transactions';

// === Package Configuration ===

/**
 * Configuration for the permissioned_groups Move package.
 * This is managed by us and provided in constants for testnet/mainnet.
 *
 * After a package upgrade on Sui, the original (V1) package ID is still needed
 * for TypeName strings (BCS parsing, permission type comparisons), Seal encryption
 * namespace, and `deriveObjectID` type tags — because Move's `type_name::with_original_ids()`
 * always references V1 addresses.
 *
 * The latest package ID is used for `moveCall` targets so that transactions
 * execute the most recent version of the contract code.
 */
export type SuiGroupsPackageConfig = {
	/** The original (V1) package ID. Used for TypeName strings, BCS, Seal namespace, and deriveObjectID. */
	originalPackageId: string;
	/** The latest (current) package ID. Used for moveCall targets. Equals originalPackageId before any upgrade. */
	latestPackageId: string;
};

export interface SuiGroupsCompatibleClient extends ClientWithCoreApi {}

export interface SuiGroupsClientOptions {
	client: SuiGroupsCompatibleClient;
	/**
	 * The witness type from the extending package that scopes permissions.
	 * This must be the full type path including package ID and module
	 * (e.g., '0xabc::my_module::MY_WITNESS').
	 *
	 * The witness type exists in the extending Move package (not in permissioned_groups),
	 * so this must always be provided by the user/extending SDK.
	 */
	witnessType: string;
	/**
	 * Custom package configuration for localnet, devnet, or custom deployments.
	 * When not provided, the config is auto-detected from the client's network.
	 */
	packageConfig?: SuiGroupsPackageConfig;
}

// === Call/Tx Options (no signer) ===

/** Options for granting a permission to a member */
export interface GrantPermissionCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Address of the member */
	member: string | TransactionArgument;
	/** The permission type to grant (e.g., '0xabc::my_app::Editor') */
	permissionType: string;
}

/** Options for revoking a permission from a member */
export interface RevokePermissionCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Address of the member */
	member: string | TransactionArgument;
	/** The permission type to revoke */
	permissionType: string;
}

/** Options for removing a member from the group */
export interface RemoveMemberCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Address of the member to remove */
	member: string | TransactionArgument;
}

// === Top-level Imperative Options (add signer) ===

/** Options for granting permission (imperative) */
export interface GrantPermissionOptions extends GrantPermissionCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

/** Options for revoking permission (imperative) */
export interface RevokePermissionOptions extends RevokePermissionCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

/** Options for removing member (imperative) */
export interface RemoveMemberOptions extends RemoveMemberCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

// === Batch/Convenience Call Options ===

/** Options for granting multiple permissions to a member in a single transaction */
export interface GrantPermissionsCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Address of the member */
	member: string | TransactionArgument;
	/** The permission types to grant (e.g., ['0xabc::my_app::Editor', '0xabc::my_app::Viewer']) */
	permissionTypes: string[];
}

/** Options for revoking multiple permissions from a member in a single transaction */
export interface RevokePermissionsCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Address of the member */
	member: string | TransactionArgument;
	/** The permission types to revoke */
	permissionTypes: string[];
}

/** Options for a member to leave a group */
export interface LeaveCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
}

/** Options for pausing a group */
export interface PauseCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/**
	 * Address to receive the `UnpauseCap`.
	 * Defaults to the transaction sender.
	 */
	unpauseCapRecipient?: string;
}

/** Options for unpausing a group */
export interface UnpauseCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Object ID or TransactionArgument for the UnpauseCap */
	unpauseCapId: string | TransactionArgument;
}

/**
 * Options for deleting a group.
 *
 * NOTE: `delete` returns a tuple `(PermissionsTable, u64, address)` from Move.
 * There is no high-level imperative variant — callers must compose this with
 * additional PTB steps (e.g., `permissions_table::destroy_empty`) in the
 * extending contract or their own transaction.
 */
export interface DeleteCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
}

// === Batch/Convenience Imperative Options ===

/** Options for granting multiple permissions (imperative) */
export interface GrantPermissionsOptions extends GrantPermissionsCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

/** Options for revoking multiple permissions (imperative) */
export interface RevokePermissionsOptions extends RevokePermissionsCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

/** Options for leaving a group (imperative) */
export interface LeaveOptions extends LeaveCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

/** Options for pausing a group (imperative) */
export interface PauseOptions extends PauseCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

/** Options for unpausing a group (imperative) */
export interface UnpauseOptions extends UnpauseCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

// === Convenience Batch Options ===

/** A member with their associated permissions, used for batch operations */
export interface MemberWithPermissions {
	/** Address of the member */
	address: string;
	/** Permission types to grant (e.g., ['0xabc::my_app::Editor', '0xabc::my_app::Viewer']) */
	permissions: string[];
}

/** Options for adding multiple members with their permissions in a single transaction */
export interface AddMembersCallOptions {
	/** Object ID or TransactionArgument for the PermissionedGroup */
	groupId: string | TransactionArgument;
	/** Members and their permissions to add */
	members: MemberWithPermissions[];
}

/** Options for adding multiple members with their permissions (imperative) */
export interface AddMembersOptions extends AddMembersCallOptions {
	/** Signer to execute the transaction */
	signer: Signer;
}

// === View Options (use string IDs for devInspect) ===

/** Options for checking if a member has a specific permission */
export interface HasPermissionViewOptions {
	/** Object ID of the PermissionedGroup */
	groupId: string;
	/** Address to check */
	member: string;
	/** The permission type to check */
	permissionType: string;
}

/** Options for checking if an address is a member */
export interface IsMemberViewOptions {
	/** Object ID of the PermissionedGroup */
	groupId: string;
	/** Address to check */
	member: string;
}

/** Options for checking if a group is paused */
export interface IsPausedViewOptions {
	/** Object ID of the PermissionedGroup */
	groupId: string;
}

/** Options for fetching a single page of members */
export interface GetMembersPaginatedViewOptions {
	/** Object ID of the PermissionedGroup */
	groupId: string;
	/** Pagination cursor from a previous response */
	cursor?: string | null;
	/** Maximum number of members to return per page */
	limit?: number;
}

/** Options for fetching all members across all pages */
export interface GetMembersExhaustiveViewOptions {
	/** Object ID of the PermissionedGroup */
	groupId: string;
	exhaustive: true;
}

export type GetMembersViewOptions =
	| GetMembersPaginatedViewOptions
	| GetMembersExhaustiveViewOptions;

/** Paginated response for getMembers */
export interface GetMembersResponse {
	members: MemberWithPermissions[];
	hasNextPage: boolean;
	cursor: string | null;
}
