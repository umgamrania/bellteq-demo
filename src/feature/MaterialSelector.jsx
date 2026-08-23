import { MATERIALS } from "../data/materials";
import styles from "./MaterialSelector.module.css";

export default function MaterialSelector({
    onSelect,
    materials = MATERIALS,
}) {
    const handleSelect = (material) => {
        // Will be wired to sidebar context
        onSelect?.(material);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>All Materials</span>
                <span className={styles.badge}>{materials.length}</span>
            </div>

            <div className={styles.grid}>
                {materials.map((material) => (
                    <button
                        key={material.id}
                        type="button"
                        className={styles.card}
                        onClick={() => handleSelect(material)}
                        aria-label={`Select ${material.name} material`}
                        title={material.description || material.name}
                    >
                        <div className={styles.swatchWrapper}>
                            <img
                                src={material.src}
                                alt={material.name}
                                className={styles.swatchImage}
                                loading="lazy"
                            />
                        </div>
                        <span className={styles.label}>{material.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

