import Sidebar from "./components/sidebar/Sidebar";
import BoardContext from "./context/board";
import BackplateSelector from "./feature/BackplateSelector";
import ComponentSelector from "./feature/ComponentSelector";
import IconSelector from "./feature/IconSelector";
import MaterialSelector from "./feature/MaterialSelector";
import Preview from "./preview/Preview";

export default function App() {
  return (
    <div className="app">
      <BoardContext>
        <Sidebar>
          <BackplateSelector title="Choose a backplate" />
          <ComponentSelector title="Choose components" />
          <IconSelector title="Choose icons" />
          <MaterialSelector title="Choose materials" />
        </Sidebar>
        <Preview />
      </BoardContext>
    </div>
  );
}