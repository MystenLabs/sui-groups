// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import type { Account } from './types.js';
import { getNewAccount } from './get-new-account.js';

export interface AccountsFixtureConfig {
	faucetUrl: string;
}

/**
 * Creates and funds a new admin account via the faucet.
 */
export async function createFundedAccount(config: AccountsFixtureConfig): Promise<Account> {
	const account = getNewAccount();

	await requestSuiFromFaucetV2({
		host: config.faucetUrl,
		recipient: account.address,
	});

	return account;
}

/**
 * Funds an existing account via the faucet.
 */
export async function fundAccount(address: string, config: AccountsFixtureConfig): Promise<void> {
	await requestSuiFromFaucetV2({
		host: config.faucetUrl,
		recipient: address,
	});
}
