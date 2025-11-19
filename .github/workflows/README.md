Publish runtime-config Azure Function workflow

Required repository secrets:

- `AZURE_CREDENTIALS` - JSON service principal credentials with Contributor access to the Function App's resource group (used by azure/login). Example created via `az ad sp create-for-rbac --name "gh-action-sp" --role contributor --scopes /subscriptions/<sub>/resourceGroups/<rg>`.
- `AZURE_RESOURCE_GROUP` - the resource group containing the Function App.
- `FUNCTION_APP_NAME` - the name of the Function App to deploy to.

Notes:

- This workflow uses a service principal (AZURE_CREDENTIALS). If you prefer OIDC (recommended), configure federated identity in Azure and replace the `Login to Azure` step with the OIDC login configuration described in Azure docs.
- The workflow performs a zip-deploy; ensure your Function App is configured for Node 18 and the `APP_CONFIG_ENDPOINT` application setting is present.

Post-deploy:

- The workflow outputs the runtime URL as a GitHub Actions output `runtime_url` which can be consumed by downstream jobs to set `VITE_RUNTIME_CONFIG_URL` when deploying the front-end.
