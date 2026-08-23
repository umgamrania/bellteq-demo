import { createContext, useState, useEffect } from "react";

export const boardContext = createContext(null);

export default function BoardContext({ children }) {
    const [backplate, setBackplate] = useState(null);
    const [slots, setSlots] = useState(0);
    const [componentRows, setComponentRows] = useState([]);

    useEffect(() => {
        console.log(componentRows)
    }, [componentRows]);

    function selectBackplate(backplate) {
        setBackplate(backplate);
        setSlots(backplate?.slots ?? 0);
        setComponentRows(Array.from({length:backplate.rows}, () => []));
    }


    const getFreeSlots = (row) => {
        if (!backplate || !backplate.rows) return 0;
        const slotsPerRow = Math.floor(backplate.slots / backplate.rows);
        const occupied = row.reduce((s, o) => s + (o.slots || 0), 0);
        return slotsPerRow - occupied;
    };

    function addComponent(component) {
        if (!backplate) return;

        const newComponent = {
            ...component,
            instance_id: typeof crypto !== "undefined" && crypto.randomUUID 
                ? crypto.randomUUID() 
                : Math.random().toString(36).substring(2, 9),
        };

        const insertIdx = componentRows.findIndex((row) => getFreeSlots(row) >= component.slots);
        
        if (insertIdx == -1)
            return alert("Not enough space on the board!");

        setComponentRows(prev => prev.map((row, idx) => idx == insertIdx ? [...row, newComponent]: row));
    }

    function removeComponent(target, componentIndex) {
        setComponentRows(prev => {
            // Support removeComponent(rowIndex, componentIndex)
            if (typeof target === "number" && typeof componentIndex === "number") {
                return prev.map((row, rIdx) =>
                    rIdx === target ? row.filter((_, cIdx) => cIdx !== componentIndex) : row
                );
            }

            // Support removeComponent(component) or removeComponent(instanceId)
            const targetId = typeof target === "object" && target !== null ? target.instance_id : target;

            return prev.map(row =>
                row.filter(c => {
                    if (targetId && c.instance_id) {
                        return c.instance_id !== targetId;
                    }
                    if (typeof target === "object" && target !== null) {
                        return c !== target;
                    }
                    return c.id !== target;
                })
            );
        });
    }

    return (
        <boardContext.Provider value={{ backplate, slots, componentRows, selectBackplate, addComponent, removeComponent }}>
            {children}
        </boardContext.Provider>
    );
}