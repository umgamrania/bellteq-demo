import { useContext } from "react";
import { BACKPLATES } from "../data/backplates";
import styles from "./BackplateSelector.module.css";
import { boardContext } from "../context/board";

export default function BackplateSelector({
    onSelect,
    backplates = BACKPLATES,
}) {
    const { selectBackplate } = useContext(boardContext);

    const handleSelect = (backplate) => {
        selectBackplate(backplate);
    };

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {backplates.map((backplate) => (
                    <button
                        key={backplate.id}
                        type="button"
                        className={styles.card}
                        onClick={() => handleSelect(backplate)}
                    >
                        <div className={styles.imageWrapper}>
                            <img
                                src={backplate.src}
                                alt={backplate.alt}
                                className={styles.image}
                                loading="lazy"
                            />
                        </div>
                        <span className={styles.label}>{backplate.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
