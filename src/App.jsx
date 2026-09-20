import { useEffect } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import BoardContext from "./context/board";
import SidebarContext from "./context/sidebar";
import PricingProvider from "./context/pricing";
import CartProvider from "./context/cart";
import BackplateSelector from "./feature/BackplateSelector";
import AccessorySelector from "./feature/AccessorySelector";
import ComponentSelector from "./feature/ComponentSelector";
import IconSelector from "./feature/IconSelector";
import MaterialSelector from "./feature/MaterialSelector";
import ExportSelector from "./feature/ExportSelector";
import WallVisualizerSelector from "./feature/WallVisualizerSelector";
import Preview from "./preview/Preview";
import PricingSidebar from "./components/pricing/PricingSidebar";
import PricingModal from "./components/pricing/PricingModal";
import { COMPANY_INFO } from "./data/companyInfo";

export default function App() {
  useEffect(() => {
    if (COMPANY_INFO?.name) {
      document.title = `${COMPANY_INFO.name} - Switchboard Customizer`;
    }
  }, []);

  return (
    <div className="app">
      <SidebarContext>
        <PricingProvider>
          <CartProvider>
            <BoardContext>
              <Sidebar>
                <BackplateSelector title="Choose a backplate" />
                <ComponentSelector title="Choose components" />
                <IconSelector title="Choose icons" />
                <MaterialSelector title="Choose materials" />
                <AccessorySelector title="Add Accessories" />
                <ExportSelector title="Export & Download" />
                <WallVisualizerSelector title="Place on Wall" />
              </Sidebar>
              <Preview />
              <PricingSidebar />
              <PricingModal />
            </BoardContext>
          </CartProvider>
        </PricingProvider>
      </SidebarContext>
    </div>
  );
}