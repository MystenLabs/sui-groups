// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { PublishedPackage, SerializableAccount } from '../helpers/types.js';

declare module 'vitest' {
	export interface ProvidedContext {
		localnetPort: number;
		graphqlPort: number;
		faucetPort: number;
		suiToolsContainerId: string;
		adminAccount: SerializableAccount;
		suiClientUrl: string;
		publishedPackages: Record<string, PublishedPackage>;
	}
}
