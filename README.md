# Turbopack + React Compiler fails with pnpm's global virtual store

With pnpm's global virtual store, `node_modules/next` and `node_modules/babel-plugin-react-compiler` are symlinks into `~/Library/pnpm/store/v11/links/...`, outside the project. `experimental.turbopackAdditionalRoots` points Turbopack at the store, so Next itself resolves, but with `reactCompiler: true` every route fails.

Next resolves `babel-plugin-react-compiler` next to `next` (in the store root) and then asks for that path relative to the project root. The two are different Turbopack filesystems, so `get_relative_request_to` returns `None`.

## Steps to reproduce

Needs pnpm 12 (`packageManager` pins 12.9.1). The global store is turned on in `pnpm-workspace.yaml`.

```sh
pnpm install
pnpm build
```

`pnpm dev` and then opening http://localhost:3000 fails the same way (HTTP 500).

## Expected

The build succeeds and the page renders, as it does with the default (project-local) virtual store.

## Actual

```
> Build error occurred
Error [TurbopackInternalError]: Failed to write app endpoint /page

Caused by:
- failed to resolve relative path for react compiler plugin

Debug info:
...
- Execution of get_client_module_options_context failed
- Execution of webpack_loader_options failed
- failed to resolve relative path for react compiler plugin
```

## Controls

- `reactCompiler: false`: builds.
- Default store (delete `pnpm-workspace.yaml`, reinstall), compiler on: builds.
- Global store without `turbopackAdditionalRoots`: fails earlier with `Could not find the Next.js package (next/package.json)`, which is what that option fixes.

## Workaround

Make next's copy of the plugin a link to a stand-in package inside the project, which loads the real plugin. The `workaround` branch has it:

```yaml
# pnpm-workspace.yaml
overrides:
  "next>babel-plugin-react-compiler": link:./react-compiler
```

```json
// react-compiler/package.json
{
  "name": "babel-plugin-react-compiler",
  "private": true,
  "main": "../node_modules/babel-plugin-react-compiler-real/dist/index.js"
}
```

In `package.json`, install the real plugin under an alias, `"babel-plugin-react-compiler-real": "npm:babel-plugin-react-compiler@1.0.0"`. With a direct `babel-plugin-react-compiler` dependency, pnpm satisfies next's peer with it and skips the override.

The build passes, and the compiler output is there (`useMemoCache` in the client component's chunk).
