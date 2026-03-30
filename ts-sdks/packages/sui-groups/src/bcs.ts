// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { bcs, type BcsType } from '@mysten/sui/bcs';

import type { SuiGroupsPackageConfig } from './types.js';

import {
	PermissionsAdmin,
	ExtensionPermissionsAdmin,
	ObjectAdmin,
	GroupDeleter,
	PausedMarker,
	GroupCreated,
	GroupDerived,
	GroupDeleted,
	GroupPaused,
	GroupUnpaused,
	MemberAdded,
	MemberRemoved,
	PermissionedGroup,
	PermissionsGranted,
	PermissionsRevoked,
} from './contracts/sui_groups/permissioned_group.js';

export type ParsedPermissionedGroup = ReturnType<typeof PermissionedGroup>['$inferType'];
export type ParsedPermissionsAdmin = (typeof PermissionsAdmin)['$inferType'];
export type ParsedExtensionPermissionsAdmin = (typeof ExtensionPermissionsAdmin)['$inferType'];
export type ParsedObjectAdmin = (typeof ObjectAdmin)['$inferType'];
export type ParsedGroupDeleter = (typeof GroupDeleter)['$inferType'];
export type ParsedPausedMarker = (typeof PausedMarker)['$inferType'];
export type ParsedGroupCreated = ReturnType<typeof GroupCreated>['$inferType'];
export type ParsedGroupDerived<DerivationKey = unknown> = {
	group_id: string;
	creator: string;
	parent_id: string;
	derivation_key: DerivationKey;
};
export type ParsedGroupDeleted = ReturnType<typeof GroupDeleted>['$inferType'];
export type ParsedGroupPaused = ReturnType<typeof GroupPaused>['$inferType'];
export type ParsedGroupUnpaused = ReturnType<typeof GroupUnpaused>['$inferType'];
export type ParsedMemberAdded = ReturnType<typeof MemberAdded>['$inferType'];
export type ParsedMemberRemoved = ReturnType<typeof MemberRemoved>['$inferType'];
export type ParsedPermissionsGranted = ReturnType<typeof PermissionsGranted>['$inferType'];
export type ParsedPermissionsRevoked = ReturnType<typeof PermissionsRevoked>['$inferType'];

const LOCAL_PACKAGE_ALIAS = '@local-pkg/sui-groups';

export interface SuiGroupsBCSOptions {
	packageConfig: SuiGroupsPackageConfig;
	witnessType: string;
}

/**
 * BCS type definitions for the permissioned-groups package.
 *
 * Each instance creates transformed copies of the generated BCS types
 * with the correct package ID in the type name, ensuring multiple SDK
 * instances with different package configurations don't interfere.
 *
 * @example
 * ```ts
 * const bcs = new SuiGroupsBCS({
 *   packageConfig: { packageId: '0x123...' }
 * });
 *
 * const group = bcs.PermissionedGroup.parse(permissionedGroupObject.content);
 * ```
 */
export class SuiGroupsBCS {
	/** Core permission: manages core permissions from this package */
	readonly PermissionsAdmin: BcsType<ParsedPermissionsAdmin, unknown>;
	/** Core permission: manages extension permissions from other packages */
	readonly ExtensionPermissionsAdmin: BcsType<ParsedExtensionPermissionsAdmin, unknown>;
	/** Core permission: grants raw &mut UID access via the actor-object pattern */
	readonly ObjectAdmin: BcsType<ParsedObjectAdmin, unknown>;
	/** Core permission: allows destroying/deleting the group */
	readonly GroupDeleter: BcsType<ParsedGroupDeleter, unknown>;
	/** Dynamic field marker set when a group is paused */
	readonly PausedMarker: BcsType<ParsedPausedMarker, unknown>;
	/** Main group struct containing membership and permission data */
	readonly PermissionedGroup: BcsType<ParsedPermissionedGroup, unknown>;
	/** Event emitted when a group is created */
	readonly GroupCreated: BcsType<ParsedGroupCreated, unknown>;
	/** Event emitted when a group is deleted */
	readonly GroupDeleted: BcsType<ParsedGroupDeleted, unknown>;
	/** Event emitted when a group is paused */
	readonly GroupPaused: BcsType<ParsedGroupPaused, unknown>;
	/** Event emitted when a group is unpaused */
	readonly GroupUnpaused: BcsType<ParsedGroupUnpaused, unknown>;
	/** Event emitted when a member is added to a group */
	readonly MemberAdded: BcsType<ParsedMemberAdded, unknown>;
	/** Event emitted when a member is removed from a group */
	readonly MemberRemoved: BcsType<ParsedMemberRemoved, unknown>;
	/** Event emitted when permissions are granted to a member */
	readonly PermissionsGranted: BcsType<ParsedPermissionsGranted, unknown>;
	/** Event emitted when permissions are revoked from a member */
	readonly PermissionsRevoked: BcsType<ParsedPermissionsRevoked, unknown>;

	readonly #phantomWitnessBcs: BcsType<any>;
	readonly #packageId: string;

	constructor(options: SuiGroupsBCSOptions) {
		this.#packageId = options.packageConfig.originalPackageId;

		// Phantom BcsType that carries the witness type name for codegen functions.
		// Phantom types don't affect serialization, so the underlying type is irrelevant.
		this.#phantomWitnessBcs = bcs.bool().transform({ name: options.witnessType });

		this.PermissionsAdmin = this.#withPackageId(PermissionsAdmin);
		this.ExtensionPermissionsAdmin = this.#withPackageId(ExtensionPermissionsAdmin);
		this.ObjectAdmin = this.#withPackageId(ObjectAdmin);
		this.GroupDeleter = this.#withPackageId(GroupDeleter);
		this.PausedMarker = this.#withPackageId(PausedMarker);
		this.PermissionedGroup = this.#withPackageId(PermissionedGroup(this.#phantomWitnessBcs));
		this.GroupCreated = this.#withPackageId(GroupCreated(this.#phantomWitnessBcs));
		this.GroupDeleted = this.#withPackageId(GroupDeleted(this.#phantomWitnessBcs));
		this.GroupPaused = this.#withPackageId(GroupPaused(this.#phantomWitnessBcs));
		this.GroupUnpaused = this.#withPackageId(GroupUnpaused(this.#phantomWitnessBcs));
		this.MemberAdded = this.#withPackageId(MemberAdded(this.#phantomWitnessBcs));
		this.MemberRemoved = this.#withPackageId(MemberRemoved(this.#phantomWitnessBcs));
		this.PermissionsGranted = this.#withPackageId(PermissionsGranted(this.#phantomWitnessBcs));
		this.PermissionsRevoked = this.#withPackageId(PermissionsRevoked(this.#phantomWitnessBcs));
	}

	/** Replaces the codegen local package alias with the real package ID in the BCS type name. */
	#withPackageId(type: BcsType<any>) {
		return type.transform({
			name: type.name.replace(LOCAL_PACKAGE_ALIAS, this.#packageId),
		});
	}

	/** Event emitted when a group is derived from a parent object */
	GroupDerived<DerivationKey extends BcsType<any>>(
		derivationKeyType: DerivationKey,
	): BcsType<ParsedGroupDerived<DerivationKey['$inferType']>, unknown> {
		return this.#withPackageId(GroupDerived(this.#phantomWitnessBcs, derivationKeyType));
	}
}
