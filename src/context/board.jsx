import { createContext, useState, useEffect, useContext } from "react";
import { sidebarContext } from "./sidebar";
import { WALL_PRESETS } from "../data/wallPresets";

export const boardContext = createContext(null);

export default function BoardContext({ children }) {
    const { setActiveIdx, activeIdx } = useContext(sidebarContext) || {};
    const [backplate, setBackplate] = useState(null);
    const [slots, setSlots] = useState(0);
    // componentIds: Array<Array<string>> — 2D array of instance_ids, preserving row layout
    const [componentIds, setComponentIds] = useState([]);
    // components: Record<string, Component> — flat lookup map keyed by instance_id
    const [components, setComponents] = useState({});
    const [activeSlot, setActiveSlot] = useState({});
    const [material, setMaterial] = useState(null);

    // Wall visualizer mockup state (Step 6)
    const DEFAULT_WALL_SCALE = 0.55;
    const [wallImage, setWallImage] = useState(WALL_PRESETS[0]?.src || "");
    const [wallPosition, setWallPosition] = useState({ x: 0, y: 0 });
    const [wallScale, setWallScale] = useState(DEFAULT_WALL_SCALE);
    const [wallRotation, setWallRotation] = useState(0);
    const [wallShadow, setWallShadow] = useState("realistic");

    const resetWallTransform = () => {
        setWallPosition({ x: 0, y: 0 });
        setWallScale(DEFAULT_WALL_SCALE);
        setWallRotation(0);
    };

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

        const nextComponents = { ...components, [instance_id]: newComponent };
        const nextComponentIds = componentIds.map((rowIds, idx) =>
            idx === insertIdx ? [...rowIds, instance_id] : rowIds
        );

        setComponents(nextComponents);
        setComponentIds(nextComponentIds);

        // Auto-advance if all slots across all rows are filled
        if (backplate.slots && backplate.rows) {
            const slotsPerRow = Math.floor(backplate.slots / backplate.rows);
            const allFilled = nextComponentIds.every((rowIds) => {
                const occupied = rowIds.reduce((s, id) => s + (nextComponents[id]?.slots || 0), 0);
                return slotsPerRow - occupied === 0;
            });

            if (allFilled && setActiveIdx) {
                setActiveIdx(2);
            }
        }
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

        // If no more empty slots remain, auto advance to Material stage
        if ((!nextSlot || !nextSlot.componentId) && setActiveIdx) {
            setActiveIdx(3);
        }
    }

    const isStageComplete = (idx) => {
        if (idx === 0) {
            return Boolean(backplate);
        }
        if (idx === 1) {
            if (!backplate || !backplate.slots || !backplate.rows) return false;
            const slotsPerRow = Math.floor(backplate.slots / backplate.rows);
            return componentIds.length > 0 && componentIds.every((rowIds) => {
                const occupied = rowIds.reduce((s, id) => s + (components[id]?.slots || 0), 0);
                return slotsPerRow - occupied === 0;
            });
        }
        if (idx === 2) {
            const switchComps = Object.values(components).filter(
                (c) => c && c.category === "switches" && Array.isArray(c.iconImages) && c.iconImages.length > 0
            );
            return switchComps.every((c) => c.iconImages.every((img) => Boolean(img)));
        }
        if (idx === 3) {
            return Boolean(material);
        }
        return true;
    };

    /** Convenience helper: look up a component by its instance_id */
    const getComponent = (id) => components[id];

    /** Export full board configuration state to an object */
    const exportConfiguration = () => {
        return {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            stageIdx: typeof activeIdx === "number" ? activeIdx : 0,
            backplate,
            slots,
            componentIds,
            components,
            material,
            activeSlot,
            wall: {
                wallImage,
                wallPosition,
                wallScale,
                wallRotation,
                wallShadow,
            },
        };
    };

    /** Download configuration as a JSON file */
    const downloadConfiguration = (customFilename) => {
        const config = exportConfiguration();
        const jsonStr = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const backplateName = backplate?.name ? backplate.name.toLowerCase().replace(/\s+/g, "-") : "board";
        const dateStr = new Date().toISOString().slice(0, 10);
        link.download = customFilename || `board-config-${backplateName}-${dateStr}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    /** Load configuration state from JSON string or object */
    const loadConfiguration = (configInput) => {
        try {
            let config = configInput;
            if (typeof configInput === "string") {
                config = JSON.parse(configInput);
            }
            if (!config || typeof config !== "object") {
                throw new Error("Invalid configuration data: Expected an object.");
            }

            if (config.backplate !== undefined) {
                setBackplate(config.backplate);
                setSlots(config.slots ?? (config.backplate?.slots ?? 0));
            }
            if (config.componentIds !== undefined) {
                setComponentIds(Array.isArray(config.componentIds) ? config.componentIds : []);
            }
            if (config.components !== undefined) {
                setComponents(typeof config.components === "object" && config.components !== null ? config.components : {});
            }
            if (config.material !== undefined) {
                setMaterial(config.material);
            }
            if (config.activeSlot !== undefined) {
                setActiveSlot(config.activeSlot || {});
            }

            if (config.wall) {
                if (config.wall.wallImage !== undefined) setWallImage(config.wall.wallImage);
                if (config.wall.wallPosition !== undefined) setWallPosition(config.wall.wallPosition);
                if (config.wall.wallScale !== undefined) setWallScale(config.wall.wallScale);
                if (config.wall.wallRotation !== undefined) setWallRotation(config.wall.wallRotation);
                if (config.wall.wallShadow !== undefined) setWallShadow(config.wall.wallShadow);
            }

            const targetStage = config.stageIdx ?? config.activeIdx;
            if (typeof targetStage === "number" && setActiveIdx) {
                setActiveIdx(targetStage);
            } else if (setActiveIdx && config.backplate) {
                if (config.material) {
                    setActiveIdx(3);
                } else {
                    setActiveIdx(1);
                }
            }

            return { success: true, config };
        } catch (err) {
            console.error("Error loading board configuration:", err);
            return { success: false, error: err.message };
        }
    };

    /** Import configuration from an uploaded File object */
    const importConfigFile = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                const err = new Error("No file selected.");
                return reject(err);
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    const result = loadConfiguration(text);
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsText(file);
        });
    };

    // Attach to window for convenient console testing & debugging
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.__boardConfig = {
                exportConfiguration,
                downloadConfiguration,
                loadConfiguration,
                importConfigFile,
            };
        }
    }, [
        backplate,
        slots,
        componentIds,
        components,
        material,
        activeSlot,
        wallImage,
        wallPosition,
        wallScale,
        wallRotation,
        wallShadow,
        activeIdx,
    ]);

    return (
        <boardContext.Provider value={{ 
            backplate, selectBackplate,
            slots, getSlotType,
            activeSlot, setActiveSlot,
            componentIds, components, 
            getComponent, addComponent, removeComponent,
            setIcon, findNextEmptySlot,
            material, selectMaterial: setMaterial, setMaterial,
            wallImage, setWallImage,
            wallPosition, setWallPosition,
            wallScale, setWallScale,
            wallRotation, setWallRotation,
            wallShadow, setWallShadow,
            resetWallTransform,
            isStageComplete,
            exportConfiguration,
            downloadConfiguration,
            loadConfiguration,
            importConfigFile }}>
            {children}
        </boardContext.Provider>
    );
}