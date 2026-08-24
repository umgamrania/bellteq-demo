import { useState, useContext, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import {
    Upload,
    Camera,
    Image as ImageIcon,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Move,
    Download,
    Check,
    Loader2,
    Sliders,
    Trash2
} from "lucide-react";
import { boardContext } from "../context/board";
import { WALL_PRESETS } from "../data/wallPresets";
import styles from "./WallVisualizerSelector.module.css";

export default function WallVisualizerSelector() {
    const {
        backplate,
        wallImage,
        setWallImage,
        setWallPosition,
        wallScale,
        setWallScale,
        resetWallTransform,
    } = useContext(boardContext);

    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [customImageName, setCustomImageName] = useState("");
    const [isExportingPng, setIsExportingPng] = useState(false);
    const [isExportingJpeg, setIsExportingJpeg] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processImageFile(file);
    };

    const processImageFile = (file) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload or capture a valid image file (PNG, JPG, JPEG, WEBP).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setWallImage(event.target.result);
                setCustomImageName(file.name || "Captured Photo");
                resetWallTransform();
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processImageFile(file);
        }
    };

    const handleSelectPreset = (preset) => {
        setWallImage(preset.src);
        setCustomImageName("");
    };

    const handleClearCustomPhoto = () => {
        setWallImage(WALL_PRESETS[0]?.src || "");
        setCustomImageName("");
        resetWallTransform();
        if (galleryInputRef.current) galleryInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    };

    const handleScaleChange = (e) => {
        const newScale = parseFloat(e.target.value);
        setWallScale(Math.min(2.5, Math.max(0.1, newScale)));
    };

    const handleScaleStep = (delta) => {
        setWallScale((prev) => {
            const next = Math.round((prev + delta) * 20) / 20;
            return Math.min(2.5, Math.max(0.1, next));
        });
    };

    const handleCenterBoard = () => {
        setWallPosition({ x: 0, y: 0 });
    };

    const isCustomImage = Boolean(
        wallImage && !WALL_PRESETS.some((preset) => preset.src === wallImage)
    );

    // Export mockup
    const handleDownloadMockup = async (format = "png") => {
        const stageNode = document.getElementById("wall-mockup-export-stage");
        if (!stageNode) {
            alert("Wall stage not found. Please try again.");
            return;
        }

        const isPng = format === "png";
        if (isPng) setIsExportingPng(true);
        else setIsExportingJpeg(true);

        const prevRadius = stageNode.style.borderRadius;

        try {
            // Force 0px border radius during export so the downloaded image has no rounded corners
            stageNode.style.borderRadius = "0px";

            // Temporarily hide helper outlines/handles
            const handles = stageNode.querySelectorAll("[data-export-hide='true']");
            handles.forEach((el) => { el.style.visibility = "hidden"; });

            const exportFn = isPng ? toPng : toJpeg;
            const dataUrl = await exportFn(stageNode, {
                pixelRatio: 2.5,
                quality: 0.95,
                cacheBust: true,
                backgroundColor: "#ffffff",
            });

            // Restore handles and radius
            handles.forEach((el) => { el.style.visibility = ""; });
            stageNode.style.borderRadius = prevRadius;

            const link = document.createElement("a");
            const boardName = backplate?.name ? backplate.name.toLowerCase().replace(/\s+/g, "-") : "design";
            link.download = `wall-mockup-${boardName}.${isPng ? "png" : "jpg"}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Error exporting wall mockup:", err);
            alert("Failed to export mockup. Please try again.");
        } finally {
            stageNode.style.borderRadius = prevRadius;
            if (isPng) setIsExportingPng(false);
            else setIsExportingJpeg(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Hidden file inputs: 1 for standard gallery / file browser, 1 for camera capture */}
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.hiddenFileInput}
                aria-label="Upload custom wall photo"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className={styles.hiddenFileInput}
                aria-label="Take wall photo with camera"
            />

            {/* 1. Custom Image Upload & Capture Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeading}>
                    <Upload size={15} />
                    <span>Upload or Capture Wall Photo</span>
                </div>

                <div
                    className={`${styles.dropZone} ${isDraggingFile ? styles.dropZoneActive : ""} ${isCustomImage ? styles.dropZoneHasImage : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isCustomImage ? (
                        <div className={styles.customImageActiveBox}>
                            <div className={styles.customThumb}>
                                <img src={wallImage} alt="Custom wall" />
                            </div>
                            <div className={styles.customMeta}>
                                <span className={styles.customName}>{customImageName || "Custom Room Photo"}</span>
                                <span className={styles.customSub}>Custom wall active</span>
                            </div>
                            <button
                                type="button"
                                className={styles.removeImageBtn}
                                onClick={handleClearCustomPhoto}
                                title="Remove custom photo and revert to preset"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ) : (
                        <div
                            className={styles.uploadPrompt}
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <div className={styles.uploadIconCircle}>
                                <Upload size={20} />
                            </div>
                            <div className={styles.uploadPromptText}>
                                <span className={styles.uploadPrimary}>Choose wall photo or drag & drop</span>
                                <span className={styles.uploadSecondary}>Supports PNG, JPG, JPEG, WEBP</span>
                            </div>
                        </div>
                    )}

                    {/* Dual Action Buttons: File Picker & Camera Capture */}
                    <div className={styles.uploadButtonsRow}>
                        <button
                            type="button"
                            className={styles.uploadChoiceBtn}
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <Upload size={14} />
                            <span>{isCustomImage ? "Choose Different Photo" : "Upload Photo"}</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.uploadChoiceBtn} ${styles.cameraBtn}`}
                            onClick={() => cameraInputRef.current?.click()}
                        >
                            <Camera size={14} />
                            <span>{isCustomImage ? "Retake Photo" : "Take Photo"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Preset Wall Styles */}
            <div className={styles.section}>
                <div className={styles.sectionHeading}>
                    <ImageIcon size={15} />
                    <span>Preset Wall Scenes</span>
                </div>

                <div className={styles.presetsGrid}>
                    {WALL_PRESETS.map((preset) => {
                        const isSelected = wallImage === preset.src;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                className={`${styles.presetCard} ${isSelected ? styles.presetSelected : ""}`}
                                onClick={() => handleSelectPreset(preset)}
                                title={preset.description}
                            >
                                <div className={styles.presetThumb}>
                                    <img src={preset.thumbnail} alt={preset.name} />
                                    {isSelected && (
                                        <div className={styles.presetCheck}>
                                            <Check size={12} />
                                        </div>
                                    )}
                                </div>
                                <span className={styles.presetName}>{preset.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Board Size & Scale Controls */}
            <div className={styles.section}>
                <div className={styles.sectionHeading}>
                    <Sliders size={15} />
                    <span>Board Scale & Placement</span>
                </div>

                <div className={styles.controlBox}>
                    <div className={styles.sliderHeader}>
                        <span className={styles.sliderLabel}>Size / Scale</span>
                        <span className={styles.sliderValue}>{Math.round(wallScale * 100)}%</span>
                    </div>

                    <div className={styles.sliderGroup}>
                        <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => handleScaleStep(-0.05)}
                            disabled={wallScale <= 0.1}
                            title="Decrease board size"
                        >
                            <ZoomOut size={15} />
                        </button>

                        <input
                            type="range"
                            min="0.1"
                            max="2.5"
                            step="0.05"
                            value={wallScale}
                            onChange={handleScaleChange}
                            className={styles.rangeSlider}
                            aria-label="Board scale slider"
                        />

                        <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => handleScaleStep(0.05)}
                            disabled={wallScale >= 2.5}
                            title="Increase board size"
                        >
                            <ZoomIn size={15} />
                        </button>
                    </div>

                    <div className={styles.actionsRow}>
                        <button
                            type="button"
                            className={styles.utilityBtn}
                            onClick={handleCenterBoard}
                            title="Center the board on the wall"
                        >
                            <Move size={14} />
                            <span>Center Board</span>
                        </button>

                        <button
                            type="button"
                            className={styles.utilityBtn}
                            onClick={resetWallTransform}
                            title="Reset position and scale"
                        >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Export Wall Mockup Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeading}>
                    <Download size={15} />
                    <span>Export Wall Mockup</span>
                </div>

                <div className={styles.exportButtons}>
                    <button
                        type="button"
                        className={styles.exportBtnPrimary}
                        onClick={() => handleDownloadMockup("png")}
                        disabled={isExportingPng}
                    >
                        {isExportingPng ? <Loader2 size={16} className={styles.spinner} /> : <Download size={16} />}
                        <span>Download Mockup (PNG)</span>
                    </button>

                    <button
                        type="button"
                        className={styles.exportBtnSecondary}
                        onClick={() => handleDownloadMockup("jpeg")}
                        disabled={isExportingJpeg}
                    >
                        {isExportingJpeg ? <Loader2 size={16} className={styles.spinner} /> : <Download size={16} />}
                        <span>Download Mockup (JPEG)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
