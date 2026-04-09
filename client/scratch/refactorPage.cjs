const fs = require('fs');

const path = 'f:/Nexus_Projects/TGAF_02/TGAF-BatchFlow/client/src/components/pages/packaging/CreateMaterialTransferPage.tsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(/import \{ Button, message, Modal, Select,/g, "import { Button, message, Select,");
content = content.replace(/const MaterialTransferPage: React\.FC = \(\) => \{/g, "import { useNavigate } from 'react-router-dom';\n\nconst CreateMaterialTransferPage: React.FC = () => {\n  const navigate = useNavigate();");

// State removals
content = content.replace(/const \[transfers, setTransfers\] = useState<Transfer\[\]>\(\[\]\);\n/g, '');
content = content.replace(/const \[loading, setLoading\] = useState\(false\);\n/g, '');
content = content.replace(/const \[expandedTransferId, setExpandedTransferId\] = useState<string \| null>\(null\);\n/g, '');
content = content.replace(/const \[isModalVisible, setIsModalVisible\] = useState\(false\);\n/g, '');

// fetch function removals
content = content.replace(/  const fetchTransfers = async \(\) => \{[\s\S]*?setLoading\(false\);\n  \};\n\n/g, '');
content = content.replace(/    fetchTransfers\(\);\n/g, '');

// Export
content = content.replace(/export default MaterialTransferPage;/g, 'export default CreateMaterialTransferPage;');

// submit replacements
content = content.replace(/setIsModalVisible\(false\);\n      fetchTransfers\(\);/g, "navigate('/packaging/material-transfer');");

// The big view replacements: remove from <div className="flex justify-between items-center"> down to <Modal ...>
// Need to find exactly where to replace
const modalMatch = content.match(/\{\/\* ═══════════════════ New Transfer Modal ═══════════════════ \*\/\}[\s\S]*?<Modal[\s\S]*?destroyOnClose\n      >/);
const headerMatch = content.match(/\{\/\* Header \*\/\}[\s\S]*?\{\/\* ═══ Transfer Table ═══ \*\//);

if (modalMatch && headerMatch) {
  // First, completely remove the header + table + modal tag
  // We'll replace it with a new header and container
  const tablePartStart = content.indexOf('{/* ═══ Transfer Table ═══ */}');
  const modalEndIndex = content.indexOf('>', content.indexOf('<Modal')) + 1;
  const chunkToRemove = content.substring(tablePartStart, modalEndIndex);
  
  content = content.replace(chunkToRemove, `<div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl overflow-hidden p-6 md:p-8">`);
  
  // replace original header
  const oldHeader = content.substring(content.indexOf('{/* Header */}'), tablePartStart);
  const newHeader = `{/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Truck className="text-violet-600" />
            Create Material Transfer
          </h1>
          <p className="text-muted-foreground mt-1">Transfer SFG & Packaging Materials to Production Lines</p>
        </div>
        <Button onClick={() => navigate('/packaging/material-transfer')} size="large">
          Back to Transfers
        </Button>
      </div>`;
      
  content = content.replace(oldHeader, newHeader);
}

// openModal removal
content = content.replace(/  \/\* ═══ Modal Open ═══ \*\/[\s\S]*?setCurrentStep\(0\);\n  \};\n/g, '');

// Footer replacements
content = content.replace(/if \(currentStep === 0\) setIsModalVisible\(false\);/g, "if (currentStep === 0) navigate('/packaging/material-transfer');");
content = content.replace(/onClick=\{\(\) => setIsModalVisible\(false\)\}/g, "onClick={() => navigate('/packaging/material-transfer')}");
content = content.replace(/<\/Modal>/g, "</div>");

fs.writeFileSync(path, content);
console.log("Success");
