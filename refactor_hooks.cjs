const fs = require('fs');

const file = 'd:/Descargas/nuestra-cuenta/src/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

// The block to replace starts around line 46: "const [coupleSettings"
// and ends after "const completePetTask = ... };" around line 251.

const startMarker = "const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>";
const endMarker = "t.id === id ? { ...t, completed: true, completedDate: new Date().toISOString() } : t\n    ));\n  };";

const startIndex = txt.indexOf(startMarker);
const endIndexText = txt.indexOf(endMarker);
const endIndex = endIndexText + endMarker.length;

if (startIndex !== -1 && endIndexText !== -1) {
  const injection = `
  const { coupleSettings, setCoupleSettings, categories, setCategories } = useSettings();
  const { transactions, savingsBalance, expensesBalance, groupedTransactions, addTransaction } = useTransactions();
  const { pets, petTasks, setPetTasks, pendingPetTasksCount, addPet, updatePet, deletePet, addPetTask, completePetTask } = usePets();
  const { tasks, addTask, toggleTask, downloadICS } = useTasks();
`;

  // Inject hook imports
  const hookImports = `
import { useSettings } from './hooks/useSettings';
import { useTransactions } from './hooks/useTransactions';
import { usePets } from './hooks/usePets';
import { useTasks } from './hooks/useTasks';
`;

  const importMarker = "import { SettingsView } from './views/SettingsView';";
  let newTxt = txt.replace(importMarker, importMarker + '\\n' + hookImports);

  // Note: Since newTxt might have shifted indices, we must re-calculate startIndex and endIndex on newTxt
  const newStartIndex = newTxt.indexOf(startMarker);
  const newEndIndexText = newTxt.indexOf(endMarker);
  const newEndIndex = newEndIndexText + endMarker.length;

  const finalTxt = newTxt.substring(0, newStartIndex) + injection + newTxt.substring(newEndIndex);

  fs.writeFileSync(file, finalTxt);
  console.log("Hooks injected successfully!");
} else {
  console.log("Could not find markers.", startIndex, endIndexText);
}
