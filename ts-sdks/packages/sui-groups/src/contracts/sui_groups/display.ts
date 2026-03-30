/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Module: display
 *
 * Display support for `PermissionedGroup<T>` types.
 *
 * Since `PermissionedGroup<T>` is defined in `permissioned_groups`, extending
 * packages cannot directly create `Display<PermissionedGroup<T>>`.
 *
 * ## Solution
 *
 * This module provides a shared `PermissionedGroupPublisher` that holds the
 * `permissioned_groups` Publisher. Extending packages can call `setup_display<T>`
 * with their own Publisher to create `Display<PermissionedGroup<T>>`.
 *
 * ## Usage
 *
 * ```move
 * module my_package::my_module;
 *
 * use sui_groups::display::{Self, PermissionedGroupPublisher};
 * use sui::package::{Self, Publisher};
 *
 * public struct MY_MODULE() has drop;
 * public struct MyWitness() has drop;
 *
 * fun init(otw: MY_MODULE, ctx: &mut TxContext) {
 *     let publisher = package::claim(otw, ctx);
 *     // Transfer publisher to sender for later use with setup_display
 *     transfer::public_transfer(publisher, ctx.sender());
 * }
 *
 * /// Call this after init to set up Display for PermissionedGroup<MyWitness>.
 * public fun setup_group_display(
 *     pg_publisher: &PermissionedGroupPublisher,
 *     publisher: &Publisher,
 *     ctx: &mut TxContext,
 * ) {
 *     display::setup_display<MyWitness>(
 *         pg_publisher,
 *         publisher,
 *         b"My Group".to_string(),
 *         b"A permissioned group".to_string(),
 *         b"https://example.com/image.png".to_string(),
 *         b"https://example.com".to_string(),
 *         b"https://example.com/group/{id}".to_string(),
 *         ctx,
 *     );
 * }
 * ```
 */

import {
	MoveTuple,
	MoveStruct,
	normalizeMoveArguments,
	type RawTransactionArgument,
} from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as _package from './deps/sui/package.js';
const $moduleName = '@local-pkg/sui-groups::display';
export const DISPLAY = new MoveTuple({ name: `${$moduleName}::DISPLAY`, fields: [bcs.bool()] });
export const PermissionedGroupPublisher = new MoveStruct({
	name: `${$moduleName}::PermissionedGroupPublisher`,
	fields: {
		id: bcs.Address,
		publisher: _package.Publisher,
	},
});
export interface SetupDisplayArguments {
	pgPublisher: RawTransactionArgument<string>;
	publisher: RawTransactionArgument<string>;
	name: RawTransactionArgument<string>;
	description: RawTransactionArgument<string>;
	imageUrl: RawTransactionArgument<string>;
	projectUrl: RawTransactionArgument<string>;
	link: RawTransactionArgument<string>;
}
export interface SetupDisplayOptions {
	package?: string;
	arguments:
		| SetupDisplayArguments
		| [
				pgPublisher: RawTransactionArgument<string>,
				publisher: RawTransactionArgument<string>,
				name: RawTransactionArgument<string>,
				description: RawTransactionArgument<string>,
				imageUrl: RawTransactionArgument<string>,
				projectUrl: RawTransactionArgument<string>,
				link: RawTransactionArgument<string>,
		  ];
	typeArguments: [string];
}
/**
 * Creates a `Display<PermissionedGroup<T>>` using the shared publisher. The caller
 * must provide their own Publisher to prove they own the module that defines type
 * T. The Display is transferred to the transaction sender.
 *
 * # Type Parameters
 *
 * - `T`: The witness type used with `PermissionedGroup<T>`
 *
 * # Parameters
 *
 * - `pg_publisher`: Reference to the shared PermissionedGroupPublisher
 * - `publisher`: Reference to the extending package's Publisher (proves ownership
 *   of T)
 * - `name`: Display name template
 * - `description`: Description template
 * - `image_url`: Static image URL for all groups of this type
 * - `project_url`: Project website URL
 * - `link`: Link template for viewing objects, use `{id}` for object ID
 *   interpolation
 * - `ctx`: Transaction context
 *
 * # Aborts
 *
 * - `ETypeNotFromModule`: if type T is not from the same module as the publisher
 */
export function setupDisplay(options: SetupDisplayOptions) {
	const packageAddress = options.package ?? '@local-pkg/sui-groups';
	const argumentsTypes = [
		null,
		null,
		'0x1::string::String',
		'0x1::string::String',
		'0x1::string::String',
		'0x1::string::String',
		'0x1::string::String',
	] satisfies (string | null)[];
	const parameterNames = [
		'pgPublisher',
		'publisher',
		'name',
		'description',
		'imageUrl',
		'projectUrl',
		'link',
	];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'display',
			function: 'setup_display',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
