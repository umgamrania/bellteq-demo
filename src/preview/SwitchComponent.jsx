import { X } from "lucide-react";
import styles from "./Preview.module.css";
import { useContext } from "react";
import { boardContext } from "../context/board";

export default function SwitchComponent({ component }) {
    const { removeComponent } = useContext(boardContext);

    return <>
        <div 
            style={{gridColumn: `span ${component.slots}`}}
            className={styles.component + " " + styles.switch}
        >
            <div className={styles.iconsContainer} data-varient={component.id}>
                <IconOverlay component={component} />
            </div>
            <button className={styles.removeBtn} onClick={() => removeComponent(component)}><X /></button>
        </div>
    </>;
}

function IconOverlay({ component }) {
    switch(component.id) {
        case "ssw-2":
            return <>
                <IconSlot component={component} idx={0} />
                <IconSlot component={component} idx={1} />
            </>

        case "ssw-1x2":
            return <>
                <div className={styles.col_1}>
                    <IconSlot component={component} idx={0} />
                </div>

                <div className={styles.col_2}>
                    <IconSlot component={component} idx={1} />
                    <IconSlot component={component} idx={2} />
                </div>
            </>

        case "ssw-2f":
            return <>
                <div className={styles.col_1}>
                    <IconSlot component={component} idx={0} />
                </div>

                <div className={styles.col_2}>
                    <IconSlot component={component} idx={1} />
                    <IconSlot component={component} idx={2} />
                </div>
            </>

        case "ssw-2x2":
            return <>
                <div className={styles.col_1}>
                    <IconSlot component={component} idx={0} />
                    <IconSlot component={component} idx={1} />
                </div>

                <div className={styles.col_2}>
                    <IconSlot component={component} idx={2} />
                    <IconSlot component={component} idx={3} />
                </div>
            </>

        case "ssw-4":
            return <>
                <IconSlot component={component} idx={0} />
                <IconSlot component={component} idx={1} />
                <IconSlot component={component} idx={2} />
                <IconSlot component={component} idx={3} />
            </>

        case "ssw-6":
            return <>
                <IconSlot component={component} idx={0} />
                <IconSlot component={component} idx={1} />
                <IconSlot component={component} idx={2} />
                <IconSlot component={component} idx={3} />
                <IconSlot component={component} idx={4} />
                <IconSlot component={component} idx={5} />
            </>


        case "ssw-4f":
            return <>
                <div className={styles.col_1}>
                    <IconSlot component={component} idx={0} />
                </div>

                <div className={styles.col_2}>
                    <IconSlot component={component} idx={1} />
                    <IconSlot component={component} idx={2} />
                    <IconSlot component={component} idx={3} />
                    <IconSlot component={component} idx={4} />
                </div>
            </>
    }
}

function IconSlot({component, idx}) {
    const { activeSlot, setActiveSlot } = useContext(boardContext);

    const image = component.iconImages[idx];
    const isActive = (activeSlot.componentId == component.instance_id) && (activeSlot.idx == idx);

    return <div
        onClick={() => setActiveSlot({ componentId: component.instance_id, idx: idx })}
        className={`${styles.iconHolder} ${isActive ? styles.active : ""}`}
    >
        {image && <img src={image} alt="" />}
    </div>
}