// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { TestProject } from 'vitest/node';
import { requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { getNewAccount, createSuiClient } from '../helpers/index.js';
import { startSuiLocalnet } from '../helpers/localnet/sui-localnet.js';
import { publishPackages } from '../helpers/localnet/publisher.js';
import { execCommand } from '../helpers/localnet/exec-command.js';
import { PACKAGES } from './config.js';

export default async function setup(project: TestProject) {
	console.log('Setting up permissioned-groups test environment...');

	const fixture = await startSuiLocalnet({
		packages: PACKAGES,
		verbose: true,
	});

	const LOCALNET_PORT = fixture.ports.localnet;
	const FAUCET_PORT = fixture.ports.faucet;
	const SUI_TOOLS_CONTAINER_ID = fixture.containerId;
	const SUI_CLIENT_URL = `http://localhost:${LOCALNET_PORT}`;

	project.provide('localnetPort', LOCALNET_PORT);
	project.provide('graphqlPort', fixture.ports.graphql);
	project.provide('faucetPort', FAUCET_PORT);
	project.provide('suiToolsContainerId', SUI_TOOLS_CONTAINER_ID);
	project.provide('suiClientUrl', SUI_CLIENT_URL);

	// Initialize sui client in container and configure localnet environment
	await execCommand(['sui', 'client', '--yes'], SUI_TOOLS_CONTAINER_ID);
	await execCommand(
		['sui', 'client', 'new-env', '--alias', 'localnet', '--rpc', 'http://127.0.0.1:9000'],
		SUI_TOOLS_CONTAINER_ID,
	);
	await execCommand(['sui', 'client', 'switch', '--env', 'localnet'], SUI_TOOLS_CONTAINER_ID);
	await execCommand(['sui', 'client', 'faucet', '--json'], SUI_TOOLS_CONTAINER_ID);

	console.log('Preparing admin account...');
	const suiClient = createSuiClient({ url: SUI_CLIENT_URL, network: 'localnet' });
	const admin = getNewAccount();
	await requestSuiFromFaucetV2({
		host: `http://localhost:${FAUCET_PORT}`,
		recipient: admin.address,
	});

	console.log('Publishing Move packages...');
	const publishedPackages = await publishPackages({
		packages: PACKAGES,
		suiClient,
		suiToolsContainerId: SUI_TOOLS_CONTAINER_ID,
	});

	project.provide('adminAccount', {
		secretKey: admin.keypair.getSecretKey(),
		address: admin.address,
	});
	project.provide('publishedPackages', publishedPackages);

	console.log('permissioned-groups test environment is ready.');
}
