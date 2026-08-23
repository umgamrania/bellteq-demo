import { useContext } from "react";
import { boardContext } from "../context/board";
import { sidebarContext } from "../context/sidebar";
import styles from "./Preview.module.css";
import SwitchComponent from "./SwitchComponent";
import OtherComponent from "./OtherComponent";

export default function Preview() {
    const { backplate, componentIds, components, material } = useContext(boardContext);
    const { activeIdx } = useContext(sidebarContext) || {};
    const rows = backplate?.rows ?? 0;
    const slotWidth = backplate?.slotWidth ?? 40;
    const slotsPerRow = rows > 0 ? Math.floor(backplate.slots / rows) : (backplate?.slots ?? 0);
    const holderWidth = `${slotsPerRow * slotWidth}px`;

    const hasMaterial = activeIdx === 3 && Boolean(material?.src);

    return (
        <div className={styles.preview}>
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
    );
}