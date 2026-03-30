// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { MovePackageConfig } from '../helpers/index.js';

/**
 * Move packages required for permissioned-groups integration tests.
 * Listed in dependency order (example-group depends on permissioned-groups).
 */
export const PACKAGES: MovePackageConfig[] = [
	{
		name: 'permissioned-groups',
		moduleName: 'display',
		localPath: 'move/packages/sui_groups',
		containerPath: '/test-data/sui_groups',
	},
	{
		name: 'example-group',
		moduleName: 'example_group',
		localPath: 'move/packages/example-group',
		containerPath: '/test-data/example-group',
	},
];
