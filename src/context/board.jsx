import { createContext, useState } from "react";

export const boardContext = createContext(null);

export default function BoardContext({ children }) {
    const [backplate, setBackplate] = useState(null);
    const [slots, setSlots] = useState(0);

    function selectBackplate(selected) {
        setBackplate(selected);
        setSlots(selected?.slots ?? 0);
    }

    return (
        <boardContext.Provider value={{ backplate, slots, selectBackplate }}>
            {children}
        </boardContext.Provider>
    );
}