import { createContext, useState } from "react";

export const sidebarContext = createContext({
    activeIdx: 0,
    setActiveIdx: () => {},
});

export default function SidebarContext({ children }) {
    const [activeIdx, setActiveIdx] = useState(0);

    return (
        <sidebarContext.Provider value={{ activeIdx, setActiveIdx }}>
            {children}
        </sidebarContext.Provider>
    );
}