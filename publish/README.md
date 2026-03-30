# Publish utilities

This package provides two main utilities:

1. [development phase] Publish a Move package to a chosen Sui network
2. [production phase] Get the unsigned bytes of the publish transaction to sign them by a multi-sig account / KMS.

## Prerequisites

- Install the required dependencies in the `publish` folder:

```
pnpm install
```

- For the use cases (1) and (2), install Sui CLI.
- For the use case (3), install Docker.

## Use Case (1): [development phase] Publish a move package to a Sui Network

1. Create a `.env` file following the structure of the [.env.example](./.env.example).
2. Fill in the variables:

- `SUI_FULLNODE_URL`: RPC URL for the target network.
- `ADMIN_SECRET_KEY`: base64-encoded secret key for the deployer.
- `MOVE_PACKAGE_PATH`: path to the Move package you want to publish.

The `ADMIN_ADDRESS` env var is not required for this use case.

3. Run the following command to build and publish the package via [publish.ts](./src/scripts/publish.ts). The script publishes the package, and then stores the response in the file `data/publish.json` so that you can capture the package and object IDs for your app:

```
pnpm run deploy
```

## Use Case (2): [production phase] Get the unsigned bytes for publishing a package

1. Create a `.env` file following the structure of the [.env.example](./.env.example).
2. Fill in the variables:

- `SUI_FULLNODE_URL`: RPC URL for the target network.
- `ADMIN_ADDRESS`: the address of the account that will later sign the publish transaction.
- `MOVE_PACKAGE_PATH`: path to the Move package you want to publish.

The `ADMIN_SECRET_KEY` env var is not required for this use case.

3. Run the following command to build and publish the package via [publishBytes.ts](./src/scripts/publishBytes.ts). The script builds the tx for publushing the package, and then stores the unsigned transaction bytes in base64 format in the file `data/publish-bytes.txt` so that you can share them with the team that performs the signing.

```
pnpm run deploy-bytes
```
