// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { SuiGroupsPackageConfig } from './types.js';

export const TESTNET_SUI_GROUPS_PACKAGE_CONFIG = {
	originalPackageId: '0xba8a26d42bc8b5e5caf4dac2a0f7544128d5dd9b4614af88eec1311ade11de79',
	latestPackageId: '0xba8a26d42bc8b5e5caf4dac2a0f7544128d5dd9b4614af88eec1311ade11de79',
} satisfies SuiGroupsPackageConfig;

export const MAINNET_SUI_GROUPS_PACKAGE_CONFIG = {
	originalPackageId: '0x541840ae7df705d1c6329c22415ed61f9140a18b79b13c1c9dc7415b115c1ba8',
	latestPackageId: '0x541840ae7df705d1c6329c22415ed61f9140a18b79b13c1c9dc7415b115c1ba8',
} satisfies SuiGroupsPackageConfig;

/**
 * The derivation key used to derive the PermissionsTable from a PermissionedGroup.
 * Must match the Move constant `PERMISSIONS_TABLE_DERIVATION_KEY_BYTES` in `permissioned_group.move`.
 */
export const PERMISSIONS_TABLE_DERIVATION_KEY = 'permissions_table';

/**
 * Returns the full Move type name for the `PausedMarker` struct.
 * Used to derive the dynamic field ID that indicates a paused group.
 *
 * @param packageId - The **original (V1)** permissioned-groups package ID.
 */
export function pausedMarkerType(packageId: string): string {
	return `${packageId}::permissioned_group::PausedMarker`;
}

/**
 * Returns full Move type paths for core permissions intended for human members.
 *
 * Does **not** include `ObjectAdmin` — that permission is reserved for actor objects
 * (e.g., `GroupManager`, `GroupLeaver`) and should be granted via
 * {@link actorObjectPermissionTypes} instead.
 *
 * @param packageId - The **original (V1)** package ID. The TypeNames stored in the
 *   PermissionsTable always use V1 addresses (via `type_name::with_original_ids`).
 *
 * @example
 * ```ts
 * const perms = permissionTypes('0xabc...');
 * // perms.PermissionsAdmin === '0xabc...::permissioned_group::PermissionsAdmin'
 *
 * await client.groups.grantPermission({
 *   groupId, member, signer,
 *   permissionType: perms.PermissionsAdmin,
 * });
 * ```
 */
export function permissionTypes(packageId: string) {
	return {
		PermissionsAdmin: `${packageId}::permissioned_group::PermissionsAdmin`,
		ExtensionPermissionsAdmin: `${packageId}::permissioned_group::ExtensionPermissionsAdmin`,
		GroupDeleter: `${packageId}::permissioned_group::GroupDeleter`,
	} as const;
}

/**
 * Returns full Move type paths for permissions reserved for actor objects.
 *
 * Actor objects are on-chain singletons (e.g., `GroupManager`, `GroupLeaver`) that
 * hold permissions on behalf of the contract. `ObjectAdmin` grants raw `&mut UID`
 * access and should never be granted to human members.
 *
 * @param packageId - The **original (V1)** package ID.
 */
export function actorObjectPermissionTypes(packageId: string) {
	return {
		ObjectAdmin: `${packageId}::permissioned_group::ObjectAdmin`,
	} as const;
}

/**
 * Returns the full Move type name for `PermissionedGroup<T>`.
 *
 * @param packageId - The **original (V1)** permissioned-groups package ID.
 *   TypeNames on-chain always use V1 addresses (via `type_name::with_original_ids`).
 * @param witnessType - The witness type parameter (e.g., `0xdef::messaging::Messaging`)
 */
export function permissionedGroupType(packageId: string, witnessType: string): string {
	return `${packageId}::permissioned_group::PermissionedGroup<${witnessType}>`;
}
