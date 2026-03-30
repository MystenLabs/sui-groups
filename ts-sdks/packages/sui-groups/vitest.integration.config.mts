// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@publish-utils': resolve(__dirname, '../../../publish/src/utils/index.ts'),
		},
	},
	test: {
		name: 'permissioned-groups-integration',
		environment: 'node',
		globalSetup: ['./test/integration/setup.ts'],
		include: ['./test/integration/**/*.test.ts'],
		testTimeout: 120_000,
		hookTimeout: 120_000,
		fileParallelism: false,
	},
});
