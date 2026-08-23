import { useContext, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { boardContext } from "../context/board";
import { sidebarContext } from "../context/sidebar";
import styles from "./Preview.module.css";
import SwitchComponent from "./SwitchComponent";
import OtherComponent from "./OtherComponent";

export default function Preview() {
    const { backplate, componentIds, components, material } = useContext(boardContext);
    const { activeIdx } = useContext(sidebarContext) || {};
    const [zoom, setZoom] = useState(1);

    const rows = backplate?.rows ?? 0;
    const slotWidth = backplate?.slotWidth ?? 40;
    const slotsPerRow = rows > 0 ? Math.floor(backplate.slots / rows) : (backplate?.slots ?? 0);
    const holderWidth = `${slotsPerRow * slotWidth}px`;

    const hasMaterial = activeIdx === 3 && Boolean(material?.src);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    return (
        <div className={styles.preview}>
            <div
                className={styles.canvas}
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                }}
            >
                {backplate?.src && (
                    <div
                        key={backplate.id}
                        className={`${styles.backplateContainer} ${
                            backplate.rows === 2 ? styles.twoRow : ""
                        } ${backplate.rows === 3 ? styles.threeRow : ""} ${
                            hasMaterial ? styles.hasMaterial : ""
                        }`.trim()}
                        style={
                            hasMaterial
                                ? {
                                      backgroundImage: `url("${material.src}")`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                      backgroundRepeat: "no-repeat",
                                  }
                                : {}
                        }
                    >
                        <img
                            src={backplate.src}
                            alt={backplate.alt || backplate.name}
                            style={hasMaterial ? { opacity: 0 } : {}}
                        />

                        {/* Dynamically generated component holder grid based on backplate rows and slots */}
                        <div className={styles.holdersContainer}>
                            {Array.from({ length: rows }, (_, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className={styles.componentHolder}
                                    style={{
                                        width: holderWidth,
                                        gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`,
                                    }}
                                    data-row-index={rowIndex}
                                >
                                    {componentIds[rowIndex]?.map((id) => {
                                        const component = components[id];
                                        if (!component) return null;
                                        return component.category === "switches"
                                            ? <SwitchComponent key={id} component={component} />
                                            : <OtherComponent key={id} component={component} />;
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom right zoom toolbar */}
            <div className={styles.zoomControls}>
                <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                    aria-label="Zoom Out"
                >
                    <Minus size={15} />
                </button>
                <button
                    type="button"
                    className={styles.zoomLabelBtn}
                    onClick={handleResetZoom}
                    title="Reset to 100%"
                    aria-label="Reset Zoom"
                >
                    {Math.round(zoom * 100)}%
                </button>
                <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    title="Zoom In"
                    aria-label="Zoom In"
                >
                    <Plus size={15} />
                </button>
            </div>
        </div>
    );
}