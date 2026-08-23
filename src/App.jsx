import Sidebar from "./components/sidebar/Sidebar";
import BackplateSelector from "./feature/BackplateSelector";
import ComponentSelector from "./feature/ComponentSelector";
import IconSelector from "./feature/IconSelector";
import MaterialSelector from "./feature/MaterialSelector";

export default function App() {
  return (
    <div className="app">
      <Sidebar>
        <BackplateSelector title="Choose a backplate" />
        <ComponentSelector title="Choose components" />
        <IconSelector title="Choose icons" />
        <MaterialSelector title="Choose materials" />
      </Sidebar>
    </div>
  );
}