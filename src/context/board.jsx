import { createContext, useState, useEffect } from "react";

export const boardContext = createContext(null);

export default function BoardContext({ children }) {
    const [backplate, setBackplate] = useState(null);
    const [slots, setSlots] = useState(0);
    // componentIds: Array<Array<string>> — 2D array of instance_ids, preserving row layout
    const [componentIds, setComponentIds] = useState([]);
    // components: Record<string, Component> — flat lookup map keyed by instance_id
    const [components, setComponents] = useState({});
    const [activeSlot, setActiveSlot] = useState({});

    useEffect(() => {
        console.log({ componentIds, components });
    }, [componentIds, components]);

    function getSlotType(slot) {
        const targetSlot = slot || activeSlot;
        if (!targetSlot) return "NORMAL";

        let componentId;
        let idx;

        if (Array.isArray(targetSlot)) {
            [componentId, idx] = targetSlot;
        } else if (typeof targetSlot === "object") {
            componentId = targetSlot.componentId;
            idx = targetSlot.idx;
        }

        if (!componentId || idx === undefined || idx === null) {
            return "NORMAL";
        }

        const component = components[componentId];
        if (!component) return "NORMAL";

        if ((component.id === "ssw-2f" || component.id === "ssw-4f") && (idx === 0)) {
            return "FAN";
        }

        if ((component.id === "ssw-1x2") && (idx === 1 || idx === 2)) {
            return "UPDOWN";
        }

        return "NORMAL";
    }

    function selectBackplate(backplate) {
        setBackplate(backplate);
        setSlots(backplate?.slots ?? 0);
        setComponentIds(Array.from({ length: backplate.rows }, () => []));
        setComponents({});
        setActiveSlot({});
    }

    const getFreeSlots = (rowIds) => {
        if (!backplate || !backplate.rows) return 0;
        const slotsPerRow = Math.floor(backplate.slots / backplate.rows);
        const occupied = rowIds.reduce((s, id) => s + (components[id]?.slots || 0), 0);
        return slotsPerRow - occupied;
    };

    function addComponent(component) {
        if (!backplate) return;

        const instance_id = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 9);

        const newComponent = { 
            ...component, 
            instance_id,
            iconImages: Array.from({length: component.icons}, () => null)
        };

        const insertIdx = componentIds.findIndex((rowIds) => getFreeSlots(rowIds) >= component.slots);

        if (insertIdx === -1)
            return alert("Not enough space on the board!");

        setComponents(prev => ({ ...prev, [instance_id]: newComponent }));
        setComponentIds(prev => prev.map((rowIds, idx) =>
            idx === insertIdx ? [...rowIds, instance_id] : rowIds
        ));
    }

    function removeComponent(target) {
        // Resolve the target instance_id
        const targetId = typeof target === "object" && target !== null
            ? target.instance_id
            : target; // already a string id

        if (!targetId) return;

        if (activeSlot?.componentId === targetId) {
            setActiveSlot({});
        }

        setComponents(prev => {
            const next = { ...prev };
            delete next[targetId];
            return next;
        });
        setComponentIds(prev => prev.map(rowIds => rowIds.filter(id => id !== targetId)));
    }

    function findNextEmptySlot(comps, currentSlot) {
        const allSlots = [];
        const sourceComps = comps || components;
        for (const row of componentIds) {
            for (const compId of row) {
                const comp = sourceComps[compId];
                if (comp && Array.isArray(comp.iconImages) && comp.iconImages.length > 0) {
                    for (let i = 0; i < comp.iconImages.length; i++) {
                        allSlots.push({ componentId: compId, idx: i });
                    }
                }
            }
        }

        if (allSlots.length === 0) {
            return {};
        }

        const currIndex = currentSlot?.componentId
            ? allSlots.findIndex((s) => s.componentId === currentSlot.componentId && s.idx === currentSlot.idx)
            : -1;

        for (let step = 1; step <= allSlots.length; step++) {
            const checkIndex = (currIndex === -1 ? step - 1 : currIndex + step) % allSlots.length;
            const candidate = allSlots[checkIndex];
            const comp = sourceComps[candidate.componentId];
            if (comp && !comp.iconImages?.[candidate.idx]) {
                return candidate;
            }
        }

        return {};
    }

    function setIcon(icon, slot) {
        const targetSlot = slot || activeSlot;
        if (!targetSlot || !targetSlot.componentId || targetSlot.idx === undefined || targetSlot.idx === null) {
            return;
        }

        const { componentId, idx } = targetSlot;
        const imageSrc = typeof icon === "object" && icon !== null ? icon.src : icon;

        const targetComponent = components[componentId];
        if (!targetComponent) return;

        const iconImages = [...(targetComponent.iconImages || [])];
        iconImages[idx] = imageSrc;

        const nextComponents = {
            ...components,
            [componentId]: {
                ...targetComponent,
                iconImages
            }
        };

        setComponents(nextComponents);
        const nextSlot = findNextEmptySlot(nextComponents, targetSlot);
        setActiveSlot(nextSlot);
    }

    /** Convenience helper: look up a component by its instance_id */
    const getComponent = (id) => components[id];

    return (
        <boardContext.Provider value={{ 
            backplate, selectBackplate,
            slots, getSlotType,
            activeSlot, setActiveSlot,
            componentIds, components, 
            getComponent, addComponent, removeComponent,
            setIcon, findNextEmptySlot }}>
            {children}
        </boardContext.Provider>
    );
}