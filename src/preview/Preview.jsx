import { useContext } from "react";
import { boardContext } from "../context/board";
import styles from "./Preview.module.css";

export default function Preview() {
    const { backplate } = useContext(boardContext);
    const rows = backplate?.rows ?? 0;
    const slotWidth = backplate?.slotWidth ?? 40;
    const slotsPerRow = rows > 0 ? Math.floor(backplate.slots / rows) : (backplate?.slots ?? 0);
    const holderWidth = `${slotsPerRow * slotWidth}px`;

    return (
        <div className={styles.preview}>
            {backplate?.src && (
                <div
                    className={`${styles.backplateContainer} ${
                        backplate.rows === 2 ? styles.twoRow : ""
                    } ${backplate.rows === 3 ? styles.threeRow : ""}`.trim()}
                >
                    <img
                        src={backplate.src}
                        alt={backplate.alt || backplate.name}
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
                                {Array.from({ length: slotsPerRow }, (_, slotIndex) => (
                                    <div
                                        key={slotIndex}
                                        className={styles.slot}
                                        data-slot-index={rowIndex * slotsPerRow + slotIndex}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}