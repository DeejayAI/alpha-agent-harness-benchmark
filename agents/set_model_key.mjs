// Stores an API key on one model entry of a AlphaAgentHarness data root without the key ever
// appearing on a command line or in the environment: the key is read from a file inside this
// process and written with AlphaAgentHarness core's addModel, the same upsert that
// `alpha config model add --api-key` performs. The entry's other fields (pricing, client
// type, base URL) are kept; add the model first if it does not exist yet, e.g.
// `ALPHA_HOME=<data root> alpha config model add --provider deepseek --model-id deepseek-flash --set-default`.
//
//   ALPHA_HOME=<data root> <node> agents/set_model_key.mjs <core index.js> <project> <provider> <model_id> <key file>
//
// <core index.js> is the installed AlphaAgentHarness core:
//   - official installer: ~/.alpha/lib/node_modules/@prismshadow/alpha-core/dist/index.js,
//     run with the installer's Node.js, ~/.alpha/node/bin/node;
//   - npm install -g @prismshadow/alpha-cli:
//     $(npm root -g)/@prismshadow/alpha-cli/node_modules/@prismshadow/alpha-core/dist/index.js.
// <project> is usually default_project. Set ALPHA_HOME on this one command (never export it):
// without it the default data root is used. The key file holds the key on one line and should
// be mode 0600. Prints one line naming the entry it stored, and no part of the key.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
if (args.length !== 5) {
  process.stderr.write(
    "usage: ALPHA_HOME=<data root> node agents/set_model_key.mjs <core index.js> <project> <provider> <model_id> <key file>\n",
  );
  process.exit(2);
}
const [coreIndex, projectId, provider, modelId, keyFile] = args;
if ((fs.statSync(keyFile).mode & 0o077) !== 0) {
  process.stderr.write(`warning: ${keyFile} is readable by other users; chmod 600 it\n`);
}
const { addModel, resolveRoot } = await import(pathToFileURL(coreIndex).href);
const key = fs.readFileSync(keyFile, "utf8").trim();
if (key.length < 8) throw new Error("the key file looks empty");
const root = resolveRoot();
await addModel(root, projectId, { provider, model_id: modelId, api_key: key });
process.stdout.write(`stored the api_key of (${provider}, ${modelId}) in ${root}/${projectId}\n`);
