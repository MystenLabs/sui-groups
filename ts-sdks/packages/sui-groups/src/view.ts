// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import { deriveDynamicFieldID, deriveObjectID } from '@mysten/sui/utils';

import { PERMISSIONS_TABLE_DERIVATION_KEY, pausedMarkerType } from './constants.js';
import type {
	GetMembersResponse,
	GetMembersViewOptions,
	HasPermissionViewOptions,
	IsMemberViewOptions,
	IsPausedViewOptions,
	MemberWithPermissions,
	SuiGroupsCompatibleClient,
	SuiGroupsPackageConfig,
} from './types.js';

/**
 * Checks whether an error is a transport/network-level error that should
 * be propagated (not swallowed as "object not found").
 *
 * Each Sui client transport produces structurally distinct transport errors:
 *
 *   - JSON-RPC `SuiHTTPStatusError`: has `status: number` and `statusText: string`
 *   - JSON-RPC `JsonRpcError`: has `code: number` and `type: string`
 *   - gRPC `RpcError` (@protobuf-ts): has `meta: object`
 *   - GraphQL `SuiGraphQLRequestError`: has `name: 'SuiGraphQLRequestError'`
 *   - GraphQL `GraphQLResponseError`: has `locations` array
 *   - `fetch` failures: `TypeError`
 *
 * Object-level errors (not found, deleted, etc.) lack these markers:
 *   - JSON-RPC / GraphQL: `ObjectError` with string `code`
 *   - gRPC: plain `Error(message)` with no transport metadata
 */
export function isTransportError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;

	const e = error as unknown as Record<string, unknown>;

	// JSON-RPC: SuiHTTPStatusError
	if (typeof e.status === 'number' && typeof e.statusText === 'string') return true;

	// JSON-RPC: JsonRpcError (numeric code + type string)
	if (typeof e.code === 'number' && typeof e.type === 'string') return true;

	// gRPC: RpcError from @protobuf-ts (carries request metadata)
	if (typeof e.meta === 'object' && e.meta !== null) return true;

	// GraphQL: SuiGraphQLRequestError
	if (error.constructor.name === 'SuiGraphQLRequestError') return true;

	// GraphQL: GraphQLResponseError
	if ('locations' in e) return true;

	// fetch() failures (network unreachable, DNS resolution, etc.)
	if (error instanceof TypeError) return true;

	return false;
}

/**
 * BCS type for dynamic field entries keyed by address with VecSet<TypeName> values.
 */
const DynamicFieldEntry = bcs.struct('Field', {
	id: bcs.Address,
	name: bcs.Address,
	value: bcs.vector(
		bcs.struct('TypeName', {
			name: bcs.string(),
		}),
	),
});

export interface SuiGroupsViewOptions {
	packageConfig: SuiGroupsPackageConfig;
	witnessType: string;
	client: SuiGroupsCompatibleClient;
}

/**
 * View methods for querying permissioned group state.
 *
 * These methods query on-chain state by fetching objects directly,
 * without requiring a signature or spending gas.
 *
 * Note: Fields like `creator` and `permissions_admin_count` are available
 * directly on the PermissionedGroup object when fetched via getObject.
 *
 * @example
 * ```ts
 * const hasPerm = await client.groups.view.hasPermission({
 *   groupId: '0x456...',
 *   member: '0x789...',
 *   permissionType: '0xabc::my_app::Editor',
 * });
 *
 * const isMember = await client.groups.view.isMember({
 *   groupId: '0x456...',
 *   member: '0x789...',
 * });
 * ```
 */
export class SuiGroupsView {
	#client: SuiGroupsCompatibleClient;
	#packageConfig: SuiGroupsPackageConfig;

	constructor(options: SuiGroupsViewOptions) {
		this.#client = options.client;
		this.#packageConfig = options.packageConfig;
	}

	/**
	 * Derives the PermissionsTable object ID from a PermissionedGroup ID.
	 *
	 * The PermissionsTable is a derived object from its parent PermissionedGroup,
	 * using the fixed derivation key "permissions_table" (as a Move `String`).
	 * This makes the table ID fully deterministic — no RPC call needed.
	 */
	#derivePermissionsTableId(groupId: string): string {
		const string_type =
			'0x0000000000000000000000000000000000000000000000000000000000000001::string::String';
		const keyBytes = bcs.string().serialize(PERMISSIONS_TABLE_DERIVATION_KEY).toBytes();
		return deriveObjectID(groupId, string_type, keyBytes);
	}

	/**
	 * Fetches a member's permissions from the group's permissions table.
	 * Returns null if the member is not in the group.
	 */
	async #getMemberPermissions(groupId: string, member: string): Promise<string[] | null> {
		const tableId = this.#derivePermissionsTableId(groupId);

		// Derive the dynamic field ID for this member's entry in the table.
		// Table entries use `address` as the key type.
		const memberBcs = bcs.Address.serialize(member).toBytes();
		const dynamicFieldId = deriveDynamicFieldID(tableId, 'address', memberBcs);

		try {
			const { object } = await this.#client.core.getObject({
				objectId: dynamicFieldId,
				include: { content: true },
			});
			const parsed = DynamicFieldEntry.parse(object.content);
			return parsed.value.map((typeName) => typeName.name);
		} catch (error) {
			if (isTransportError(error)) throw error;
			// Object doesn't exist means member is not in the group
			return null;
		}
	}

	/**
	 * Checks if the given address has the specified permission.
	 *
	 * @param options.groupId - Object ID of the PermissionedGroup
	 * @param options.member - Address to check
	 * @param options.permissionType - The permission type to check (e.g., '0xabc::my_app::Editor')
	 * @returns `true` if the address has the permission, `false` otherwise
	 */
	async hasPermission(options: HasPermissionViewOptions): Promise<boolean> {
		const permissions = await this.#getMemberPermissions(options.groupId, options.member);
		if (permissions === null) {
			return false;
		}
		// Normalize the permission type to match Move's type_name format (no 0x prefix)
		const normalizedPermissionType = options.permissionType.replace(/^0x/, '');
		return permissions.includes(normalizedPermissionType);
	}

	/**
	 * Checks if the given address is a member of the group.
	 * A member is any address that has at least one permission.
	 *
	 * @param options.groupId - Object ID of the PermissionedGroup
	 * @param options.member - Address to check
	 * @returns `true` if the address is a member, `false` otherwise
	 */
	async isMember(options: IsMemberViewOptions): Promise<boolean> {
		const permissions = await this.#getMemberPermissions(options.groupId, options.member);
		return permissions !== null;
	}

	/**
	 * Fetches PermissionsTable entries by their dynamic field IDs
	 * and parses each into a MemberWithPermissions.
	 */
	async #fetchPermissionsTableEntries(fieldIds: string[]): Promise<MemberWithPermissions[]> {
		if (fieldIds.length === 0) return [];

		const { objects } = await this.#client.core.getObjects({
			objectIds: fieldIds,
			include: { content: true },
		});

		const members: MemberWithPermissions[] = [];
		for (const obj of objects) {
			if (obj instanceof Error) continue;
			const parsed = DynamicFieldEntry.parse(obj.content);
			members.push({
				address: parsed.name,
				permissions: parsed.value.map((typeName) => typeName.name),
			});
		}
		return members;
	}

	/**
	 * Returns members of the group with their permissions.
	 *
	 * Supports two modes:
	 * - **Paginated** (default): returns a single page of members with cursor-based pagination.
	 * - **Exhaustive** (`{ exhaustive: true }`): fetches all members across all pages.
	 *
	 * @example
	 * ```ts
	 * // Paginated
	 * const page = await client.groups.view.getMembers({ groupId: '0x...' });
	 * console.log(page.members, page.hasNextPage, page.cursor);
	 *
	 * // Exhaustive
	 * const all = await client.groups.view.getMembers({ groupId: '0x...', exhaustive: true });
	 * console.log(all.members); // all.hasNextPage is always false
	 * ```
	 */
	async getMembers(options: GetMembersViewOptions): Promise<GetMembersResponse> {
		const tableId = this.#derivePermissionsTableId(options.groupId);

		if ('exhaustive' in options) {
			const allMembers: MemberWithPermissions[] = [];
			let cursor: string | null = null;
			let hasNextPage = true;

			while (hasNextPage) {
				const page = await this.#client.core.listDynamicFields({
					parentId: tableId,
					cursor,
				});
				const members = await this.#fetchPermissionsTableEntries(
					page.dynamicFields.map((f) => f.fieldId),
				);
				allMembers.push(...members);
				cursor = page.cursor;
				hasNextPage = page.hasNextPage;
			}

			return { members: allMembers, hasNextPage: false, cursor: null };
		}

		// Paginated mode
		const page = await this.#client.core.listDynamicFields({
			parentId: tableId,
			cursor: options.cursor ?? null,
			limit: options.limit,
		});

		const members = await this.#fetchPermissionsTableEntries(
			page.dynamicFields.map((f) => f.fieldId),
		);

		return { members, hasNextPage: page.hasNextPage, cursor: page.cursor };
	}

	/**
	 * Checks if the group is currently paused.
	 *
	 * A group is paused when it has a `PausedMarker` dynamic field on its UID.
	 * Paused groups reject all mutation calls.
	 *
	 * @param options.groupId - Object ID of the PermissionedGroup
	 * @returns `true` if the group is paused, `false` otherwise
	 */
	async isPaused(options: IsPausedViewOptions): Promise<boolean> {
		// PausedMarker is a unit struct with a single bool field (MoveTuple pattern).
		// The key stored on-chain is `false` (the phantom bool value).
		const keyBytes = bcs.bool().serialize(false).toBytes();
		const markerType = pausedMarkerType(this.#packageConfig.originalPackageId);
		const pausedFieldId = deriveDynamicFieldID(options.groupId, markerType, keyBytes);
		try {
			await this.#client.core.getObject({ objectId: pausedFieldId });
			return true;
		} catch (error) {
			if (isTransportError(error)) throw error;
			return false;
		}
	}
}
