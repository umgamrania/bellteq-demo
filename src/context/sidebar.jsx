import { createContext, useState } from "react";

export const sidebarContext = createContext(null);

export default function SidebarContext({children}) {
    return <sidebarContext.Provider value={null}>
        {children}
    </sidebarContext.Provider>
}