// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { SuiGrpcClient } from '@mysten/sui/grpc';

/**
 * Supported transport types for the Sui client.
 *
 * - `'jsonRpc'` — uses `SuiJsonRpcClient` (HTTP JSON-RPC)
 * - `'grpc'` — uses `SuiGrpcClient` (gRPC-Web)
 *
 * Defaults to `'grpc'`. Can be overridden via the `SUI_TRANSPORT`
 * environment variable (e.g. `SUI_TRANSPORT=jsonRpc pnpm test`).
 */
export type SuiTransport = 'jsonRpc' | 'grpc';

export interface CreateSuiClientOptions {
	url: string;
	network: SuiClientTypes.Network;
	transport?: SuiTransport;
	mvr?: SuiClientTypes.MvrOptions;
}

/**
 * Resolves the transport type from an explicit option or the `SUI_TRANSPORT` env var.
 * Falls back to `'grpc'`.
 */
export function resolveTransport(explicit?: SuiTransport): SuiTransport {
	if (explicit) return explicit;
	const env = process.env.SUI_TRANSPORT;
	if (env === 'grpc' || env === 'jsonRpc') return env;
	return 'grpc';
}

/**
 * Creates a Sui client using the specified transport (or env-var default).
 *
 * Both `SuiJsonRpcClient` and `SuiGrpcClient` extend `BaseClient`, so
 * the returned client supports `.$extend()` identically.
 */
export function createSuiClient(options: CreateSuiClientOptions): ClientWithCoreApi {
	const { url, network, mvr } = options;
	const transport = resolveTransport(options.transport);

	switch (transport) {
		case 'grpc':
			return new SuiGrpcClient({ baseUrl: url, network, mvr });
		case 'jsonRpc':
			return new SuiJsonRpcClient({ url, network, mvr });
	}
}
