import Sidebar from "./components/sidebar/Sidebar";
import BoardContext from "./context/board";
import SidebarContext from "./context/sidebar";
import PricingProvider from "./context/pricing";
import BackplateSelector from "./feature/BackplateSelector";
import ComponentSelector from "./feature/ComponentSelector";
import IconSelector from "./feature/IconSelector";
import MaterialSelector from "./feature/MaterialSelector";
import ExportSelector from "./feature/ExportSelector";
import Preview from "./preview/Preview";
import PricingSidebar from "./components/pricing/PricingSidebar";
import PricingModal from "./components/pricing/PricingModal";

export default function App() {
  return (
    <div className="app">
      <SidebarContext>
        <PricingProvider>
          <BoardContext>
            <Sidebar>
              <BackplateSelector title="Choose a backplate" />
              <ComponentSelector title="Choose components" />
              <IconSelector title="Choose icons" />
              <MaterialSelector title="Choose materials" />
              <ExportSelector title="Export & Download" />
            </Sidebar>
            <Preview />
            <PricingSidebar />
            <PricingModal />
          </BoardContext>
        </PricingProvider>
      </SidebarContext>
    </div>
  );
}