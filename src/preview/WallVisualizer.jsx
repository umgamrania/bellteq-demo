import { useContext, useState, useRef, useEffect, useCallback } from "react";
import {
    Move,
    Upload,
    Camera
} from "lucide-react";
import { boardContext } from "../context/board";
import SwitchComponent from "./SwitchComponent";
import OtherComponent from "./OtherComponent";
import styles from "./WallVisualizer.module.css";
import previewStyles from "./Preview.module.css";

const NATURAL_WALL_SHADOW = "drop-shadow(0 18px 30px rgba(0, 0, 0, 0.42)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.22))";

export default function WallVisualizer() {
    const {
        backplate,
        componentIds,
        components,
        material,
        wallImage,
        setWallImage,
        wallPosition,
        setWallPosition,
        wallScale,
        setWallScale,
        resetWallTransform,
    } = useContext(boardContext);

    const viewportRef = useRef(null);
    const stageRef = useRef(null);
    const boardRef = useRef(null);
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const [isDraggingBoard, setIsDraggingBoard] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [initialBoardPos, setInitialBoardPos] = useState({ x: 0, y: 0 });

    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [resizeStartData, setResizeStartData] = useState({ startY: 0, startScale: 1 });

    const [isHovered, setIsHovered] = useState(false);

    const rows = backplate?.rows ?? 0;
    const slotWidth = backplate?.slotWidth ?? 40;
    const slotsPerRow = rows > 0 ? Math.floor(backplate.slots / rows) : (backplate?.slots ?? 0);
    const holderWidth = `${slotsPerRow * slotWidth}px`;
    const hasMaterial = Boolean(material?.src);

    // 1. Drag & Move Board Implementation
    const handleBoardPointerDown = (e) => {
        if (e.target.closest("[data-resize-handle]")) return;

        e.stopPropagation();
        setIsDraggingBoard(true);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setInitialBoardPos({ ...wallPosition });
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleBoardPointerMove = (e) => {
        if (!isDraggingBoard) return;
        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;

        setWallPosition({
            x: Math.round(initialBoardPos.x + dx),
            y: Math.round(initialBoardPos.y + dy),
        });
    };

    const handleBoardPointerUp = (e) => {
        if (isDraggingBoard) {
            setIsDraggingBoard(false);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // Ignore capture release error if already lost
            }
        }
    };

    // 2. Corner Resize Handles Implementation
    const handleResizePointerDown = (e, handleName) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handleName);
        setResizeStartData({
            startX: e.clientX,
            startY: e.clientY,
            startScale: wallScale,
        });
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleResizePointerMove = (e) => {
        if (!isResizing) return;
        const dy = e.clientY - resizeStartData.startY;
        const dx = e.clientX - resizeStartData.startX;

        let delta = 0;
        if (resizeHandle === "se" || resizeHandle === "e" || resizeHandle === "s") {
            delta = (dx + dy) / 200;
        } else if (resizeHandle === "nw" || resizeHandle === "w" || resizeHandle === "n") {
            delta = (-dx - dy) / 200;
        } else if (resizeHandle === "ne") {
            delta = (dx - dy) / 200;
        } else if (resizeHandle === "sw") {
            delta = (-dx + dy) / 200;
        }

        const newScale = Math.min(2.5, Math.max(0.1, Math.round((resizeStartData.startScale + delta) * 100) / 100));
        setWallScale(newScale);
    };

    const handleResizePointerUp = (e) => {
        if (isResizing) {
            setIsResizing(false);
            setResizeHandle(null);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // Ignore
            }
        }
    };

    // 3. Mouse Wheel Scale on Board
    const handleWheel = useCallback(
        (e) => {
            if (isHovered || e.target.closest("#draggable-wall-board")) {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.05 : -0.05;
                setWallScale((prev) => {
                    const next = Math.round((prev + delta) * 20) / 20;
                    return Math.min(2.5, Math.max(0.1, next));
                });
            }
        },
        [isHovered, setWallScale]
    );

    useEffect(() => {
        const boardEl = boardRef.current;
        if (!boardEl) return;
        boardEl.addEventListener("wheel", handleWheel, { passive: false });
        return () => boardEl.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setWallImage(event.target.result);
                    resetWallTransform();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div
            ref={viewportRef}
            className={styles.visualizerViewport}
        >
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
            />

            {/* Main Wall Stage Container for display and export */}
            <div
                ref={stageRef}
                id="wall-mockup-export-stage"
                className={styles.wallStage}
            >
                {/* Background Wall Image */}
                {wallImage ? (
                    <img
                        src={wallImage}
                        alt="Room Wall Background"
                        className={styles.wallBackgroundImg}
                        draggable={false}
                    />
                ) : (
                    <div className={styles.emptyStagePlaceholder}>
                        <div className={styles.emptyIconCircle}>
                            <Upload size={32} />
                        </div>
                        <h3>Upload or capture your room photo</h3>
                        <p>Select an image to see your switchboard placed on your wall</p>
                        <div className={styles.emptyActionBtns}>
                            <button
                                type="button"
                                className={styles.emptyBtn}
                                onClick={() => galleryInputRef.current?.click()}
                            >
                                <Upload size={14} />
                                <span>Upload Photo</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.emptyBtn} ${styles.emptyCameraBtn}`}
                                onClick={() => cameraInputRef.current?.click()}
                            >
                                <Camera size={14} />
                                <span>Take Photo</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Draggable & Scalable Switchboard Element */}
                {backplate?.src && (
                    <div
                        ref={boardRef}
                        id="draggable-wall-board"
                        className={`${styles.boardWrapper} ${
                            isDraggingBoard ? styles.isDragging : ""
                        } ${isHovered || isDraggingBoard || isResizing ? styles.isFocused : ""}`}
                        style={{
                            transform: `translate(${wallPosition.x}px, ${wallPosition.y}px) scale(${wallScale})`,
                            filter: NATURAL_WALL_SHADOW,
                        }}
                        onPointerDown={handleBoardPointerDown}
                        onPointerMove={handleBoardPointerMove}
                        onPointerUp={handleBoardPointerUp}
                        onPointerCancel={handleBoardPointerUp}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        {/* Live Board Component */}
                        <div
                            className={`${previewStyles.backplateContainer} ${styles.cleanBoard} ${
                                backplate.rows === 2 ? previewStyles.twoRow : ""
                            } ${backplate.rows === 3 ? previewStyles.threeRow : ""} ${
                                hasMaterial ? previewStyles.hasMaterial : ""
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
                                draggable={false}
                            />

                            <div className={previewStyles.holdersContainer}>
                                {Array.from({ length: rows }, (_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className={previewStyles.componentHolder}
                                        style={{
                                            width: holderWidth,
                                            gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`,
                                        }}
                                        data-row-index={rowIndex}
                                    >
                                        {componentIds[rowIndex]?.map((id) => {
                                            const component = components[id];
                                            if (!component) return null;
                                            return component.category === "switches" ? (
                                                <SwitchComponent key={id} component={component} />
                                            ) : (
                                                <OtherComponent key={id} component={component} />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Selection Outline & Resize Handles (Hidden on Export) */}
                        <div
                            className={styles.selectionOutline}
                            data-export-hide="true"
                            style={{
                                opacity: isHovered || isDraggingBoard || isResizing ? 1 : 0,
                            }}
                        >
                            {/* Drag Indicator Header Pill */}
                            <div className={styles.dragIndicatorPill}>
                                <Move size={11} />
                                <span>Drag to move • Scale: {Math.round(wallScale * 100)}%</span>
                            </div>

                            {/* 4 Corner Resize Handles */}
                            {["nw", "ne", "se", "sw"].map((handle) => (
                                <div
                                    key={handle}
                                    className={`${styles.resizeHandle} ${styles[`handle_${handle}`]}`}
                                    data-resize-handle="true"
                                    onPointerDown={(e) => handleResizePointerDown(e, handle)}
                                    onPointerMove={handleResizePointerMove}
                                    onPointerUp={handleResizePointerUp}
                                    onPointerCancel={handleResizePointerUp}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
