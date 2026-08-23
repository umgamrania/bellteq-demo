import { useContext } from "react";
import { boardContext } from "../context/board";
import styles from "./Preview.module.css";
import SwitchComponent from "./SwitchComponent";
import OtherComponent from "./OtherComponent";

export default function Preview() {
    const { backplate, componentRows } = useContext(boardContext);
    const rows = backplate?.rows ?? 0;
    const slotWidth = backplate?.slotWidth ?? 40;
    const slotsPerRow = rows > 0 ? Math.floor(backplate.slots / rows) : (backplate?.slots ?? 0);
    const holderWidth = `${slotsPerRow * slotWidth}px`;

    return (
        <div className={styles.preview}>
            {backplate?.src && (
                <div
                    key={backplate.id}
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
                                {componentRows[rowIndex]?.map((component, idx) => (
                                    component.category == "switches"
                                    ? <SwitchComponent key={`${rowIndex}.${idx}`} component={component} />
                                    : <OtherComponent key={`${rowIndex}.${idx}`} component={component} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}