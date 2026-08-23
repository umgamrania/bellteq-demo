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
            <button className={styles.removeBtn} onClick={() => removeComponent(component)}><X /></button>
        </div>
    </>;
}