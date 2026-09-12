import { useContext, useState, useRef, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { boardContext } from "../context/board";
import { sidebarContext } from "../context/sidebar";
import styles from "./Preview.module.css";
import SwitchComponent from "./SwitchComponent";
import OtherComponent from "./OtherComponent";
import WallVisualizer from "./WallVisualizer";

export default function Preview() {
    const { backplate, componentIds, components, material } = useContext(boardContext);
    const { activeIdx } = useContext(sidebarContext) || {};

    // If on Step 6 (Wall Placement / Room Visualizer), render WallVisualizer
    if (activeIdx === 5) {
        return <WallVisualizer />;
    }

    const [zoom, setZoom] = useState(1);

    const containerRef = useRef(null);
    const boardRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
    const [boardDimensions, setBoardDimensions] = useState({ width: 380, height: 160 });

    useEffect(() => {
        if (!containerRef.current) return;
        const updateContainerSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        updateContainerSize();
        const ro = new ResizeObserver(updateContainerSize);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!boardRef.current) return;
        const updateBoardSize = () => {
            if (boardRef.current) {
                const w = boardRef.current.offsetWidth;
                const h = boardRef.current.offsetHeight;
                if (w > 0 && h > 0) {
                    setBoardDimensions({ width: w, height: h });
                }
            }
        };
        updateBoardSize();
        const ro = new ResizeObserver(updateBoardSize);
        ro.observe(boardRef.current);
        return () => ro.disconnect();
    }, [backplate]);

    const rows = backplate?.rows ?? 0;
    const slotWidth = backplate?.slotWidth ?? 40;
    const slotsPerRow = rows > 0 ? Math.floor(backplate.slots / rows) : (backplate?.slots ?? 0);
    const holderWidth = `${slotsPerRow * slotWidth + 2}px`;

    const hasMaterial = activeIdx >= 3 && Boolean(material?.src);

    // Auto-fit scale to guarantee board fits on narrow screens with 100% aspect ratio preserved
    const padding = 32;
    const availableWidth = Math.max(100, containerSize.width - padding);
    const availableHeight = Math.max(100, containerSize.height - padding);
    const fitScale = Math.min(
        1,
        availableWidth / (boardDimensions.width || 380),
        availableHeight / (boardDimensions.height || 160)
    );
    const effectiveScale = zoom * fitScale;

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
        <div ref={containerRef} className={styles.preview}>
            <div
                className={styles.canvas}
                style={{
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: "center center",
                }}
            >
                {backplate?.src && (
                    <div
                        ref={boardRef}
                        id="switchboard-board-container"
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