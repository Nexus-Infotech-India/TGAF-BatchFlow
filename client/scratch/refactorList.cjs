const fs = require('fs');
const path = 'f:/Nexus_Projects/TGAF_02/TGAF-BatchFlow/client/src/components/pages/packaging/MaterialTransferPage.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add useNavigate
content = content.replace(/import \{ Button, message, Modal, Select, InputNumber, Input, Checkbox, Tooltip \} from 'antd';/, "import { Button, message } from 'antd';\nimport { useNavigate } from 'react-router-dom';");

// 2. We can just keep the list part and remove the modal part
const modalStart = content.indexOf('{/* ═══════════════════ New Transfer Modal ═══════════════════ */}');
const pageEnd = content.lastIndexOf('</motion.div>');
if (modalStart !== -1 && pageEnd !== -1) {
  content = content.substring(0, modalStart) + "\n    </motion.div>\n  );\n};\n\nexport default MaterialTransferPage;\n";
}

// 3. Update the button to use navigate Instead of openModal
content = content.replace(/onClick=\{openModal\}/g, "onClick={() => navigate('/packaging/material-transfer/create')}");

// 4. Inject navigate initialization
content = content.replace(/const MaterialTransferPage: React.FC = \(\) => \{/g, "const MaterialTransferPage: React.FC = () => {\n  const navigate = useNavigate();");

// 5. Remove all the unused states and fetches that were for the create flow
// We just keep 'transfers', 'loading', 'expandedTransferId'
const stateToRemoveStart = content.indexOf('// Form State');
const fetchHelpersStart = content.indexOf('/* ═══ Fetch Helpers ═══ */');
if (stateToRemoveStart !== -1 && fetchHelpersStart !== -1) {
  // It's already cleanly separated!
  // Wait, let's just do it directly.
}

content = content.replace(/\/\/ Form State[\s\S]*?(?=\/\* ═══ Fetch Helpers ═══ \*\/)/, '');

content = content.replace(/const fetchLocations = async \(\) => \{[\s\S]*?\};\n/g, '');
content = content.replace(/const fetchSfgWarehouseStock = async \(\) => \{[\s\S]*?\};\n/g, '');
content = content.replace(/const fetchPackagingMaterials = async \(\) => \{[\s\S]*?\};\n/g, '');

content = content.replace(/fetchLocations\(\);\n/g, '');

content = content.replace(/\/\* ═══ Modal Open ═══ \*\/[\s\S]*?(?=\/\* ═══ Helpers ═══ \*\/)/, "");

fs.writeFileSync(path, content);
console.log("Success");
