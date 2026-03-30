// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { SuiCodegenConfig } from '@mysten/codegen';

const config: SuiCodegenConfig = {
	output: './src/contracts',
	generateSummaries: true,
	prune: true,
	includePhantomTypeParameters: true,
	packages: [
		{
			package: '@local-pkg/sui-groups',
			path: '../../../move/packages/sui_groups',
		},
	],
};

export default config;
