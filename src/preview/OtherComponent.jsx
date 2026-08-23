import { X } from "lucide-react";
import styles from "./Preview.module.css";
import { useContext } from "react";
import { boardContext } from "../context/board";
import { sidebarContext } from "../context/sidebar";

export default function OtherComponent({component}) {
    const { removeComponent } = useContext(boardContext);
    const { activeIdx } = useContext(sidebarContext) || {};
    const isComponentSection = activeIdx === 1;

    return <>
        <div 
            style={{gridColumn: `span ${component.slots}`}}
            className={styles.component + " " + styles.other}
        >
            <img src={component.src} />
            {isComponentSection && (
                <button className={styles.removeBtn} onClick={() => removeComponent(component)} ><X /></button>
            )}
        </div>
    </>;
}