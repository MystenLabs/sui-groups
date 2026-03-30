/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Module: permissions_table
 *
 * Internal data structure for storing member permissions. Maps
 * `address -> VecSet<TypeName>` using dynamic fields on a derived object. Created
 * as a child of `PermissionedGroup` for easy discoverability.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/sui-groups::permissions_table';
export const PermissionsTable = new MoveStruct({
	name: `${$moduleName}::PermissionsTable`,
	fields: {
		id: bcs.Address,
		length: bcs.u64(),
	},
});
export interface DestroyEmptyArguments {
	self: RawTransactionArgument<string>;
}
export interface DestroyEmptyOptions {
	package?: string;
	arguments: DestroyEmptyArguments | [self: RawTransactionArgument<string>];
}
/**
 * Destroys an empty PermissionsTable.
 *
 * # Aborts
 *
 * - `EPermissionsTableNotEmpty`: if the table still has members
 */
export function destroyEmpty(options: DestroyEmptyOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['self'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'permissions_table',
			function: 'destroy_empty',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		});
}
