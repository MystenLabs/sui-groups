/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Module: unpause_cap
 *
 * Capability required to unpause a `PermissionedGroup<T>`. Returned by
 * `permissioned_group::pause()`.
 *
 * The phantom `T` scopes the cap to the group's package type — a cap from one
 * package's group cannot unpause a different package's group.
 *
 * ## Usage
 *
 * **Emergency fix pattern (PTB):**
 *
 * ```
 * let cap = group.pause(ctx);
 * // fix permissions in the same PTB
 * group.unpause(cap, ctx);
 * ```
 *
 * **Archive pattern (messaging layer):**
 *
 * ```
 * // get uid before pausing
 * let uid = group.object_uid_mut(&group_manager.id);
 * // attach ArchiveStamp as a permanent marker
 * dynamic_field::add(uid, ArchiveStamp(), true);
 * // pause and immediately burn the cap — unpause is now impossible
 * let cap = group.pause(ctx);
 * unpause_cap::burn(cap);
 * // Alternative: transfer::public_freeze_object(cap)
 * //   — makes the cap immutable and un-passable by value
 * ```
 */

import { type BcsType, bcs } from '@mysten/sui/bcs';
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/sui-groups::unpause_cap';
/**
 * Owned capability required to unpause a `PermissionedGroup<T>`. Has `store` so it
 * can be wrapped or stored as a dynamic object field.
 */
export function UnpauseCap<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::UnpauseCap<${typeParameters[0].name as T['name']}>`,
		fields: {
			id: bcs.Address,
			/**
			 * ID of the group this cap belongs to. Checked in `permissioned_group::unpause()`
			 * to prevent cross-group misuse.
			 */
			group_id: bcs.Address,
		},
	});
}
export interface BurnArguments {
	cap: RawTransactionArgument<string>;
}
export interface BurnOptions {
	package?: string;
	arguments: BurnArguments | [cap: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Burns the cap, making the group's pause permanent. Call this to archive a group
 * — once burned, unpause is impossible.
 *
 * Alternative: `transfer::public_freeze_object(cap)` — makes the cap immutable
 * (cannot be passed by value to `unpause()`), also preventing unpause without
 * destroying it.
 */
export function burn(options: BurnOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['cap'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'unpause_cap',
			function: 'burn',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
