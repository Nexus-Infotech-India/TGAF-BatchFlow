const fs = require('fs');
const path = 'f:/Nexus_Projects/TGAF_02/TGAF-BatchFlow/client/src/App.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('import CreateMaterialTransferPage')) {
  content = content.replace(
    /import MaterialTransferPage from '\.\/components\/pages\/packaging\/MaterialTransferPage';/,
    "import MaterialTransferPage from './components/pages/packaging/MaterialTransferPage';\nimport CreateMaterialTransferPage from './components/pages/packaging/CreateMaterialTransferPage';"
  );
}

if (!content.includes('/packaging/material-transfer/create')) {
  // We want to insert the new route right after the existing MaterialTransferPage Route block
  const routeMatchText = `path="/packaging/material-transfer"
              element={
                <PermissionedRoute
                  path="/packaging/material-transfer"
                  element={
                    <SecureRoute
                      element={<MaterialTransferPage />}
                      permissionKey="manage_pkg_material_transfer"
                    />
                  }
                  name="Material Transfer"
                  description="Transfer SFG & packing materials to packaging production"
                  permissionKey="manage_pkg_material_transfer"
                />
              }
            />`;

  const newRouteInsertation = `

            <Route
              path="/packaging/material-transfer/create"
              element={
                <PermissionedRoute
                  path="/packaging/material-transfer/create"
                  element={
                    <SecureRoute
                      element={<CreateMaterialTransferPage />}
                      permissionKey="manage_pkg_material_transfer"
                    />
                  }
                  name="Create Transfer"
                  description="Create new material transfer for production"
                  permissionKey="manage_pkg_material_transfer"
                />
              }
            />`;
  
  // Actually, there's a `<Route ... />` wrapping it
  const fullMatch = `<Route
              ${routeMatchText}`;

  if (content.includes(fullMatch)) {
    content = content.replace(fullMatch, fullMatch + newRouteInsertation);
  } else {
    // try looser replace
    const fallbackMatch = `element={<MaterialTransferPage />}`;
    content = content.replace(
      /<\/Route>(?=\s*<Route\s*path="\/packaging\/create-fg-batch")/,
      `</Route>\n${newRouteInsertation}\n`
    );
  }
}

fs.writeFileSync(path, content);
console.log("Success updated App.tsx");
