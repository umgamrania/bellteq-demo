import { useContext } from "react";
import { boardContext } from "../context/board";
import styles from "./Preview.module.css"

export default function Preview() {
    const { backplate } = useContext(boardContext);

    return (
        <div className={styles.preview}>
            <div className={styles.backplateContainer + " " + (backplate?.rows == 2 ? styles.twoRow : "") + (backplate?.rows == 3 ? styles.threeRow : "")}>
                {backplate?.src && (
                    <img
                        src={backplate.src} 
                        alt={backplate.alt || backplate.name} 
                    />
                )}
            </div>
        </div>
    );
}