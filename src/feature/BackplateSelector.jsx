import styles from "./BackplateSelector.module.css";

const BACKPLATES = Array.from({ length: 9 }, (_, index) => {
    const id = index + 1;
    return {
        id,
        name: `Backplate ${id}`,
        src: `/backplates/${id}.png`,
        alt: `Backplate design ${id}`,
    };
});

export default function BackplateSelector({
    onSelect,
    backplates = BACKPLATES,
}) {
    const handleSelect = (backplate) => {
        // Will be wired to sidebar context
        onSelect?.(backplate);
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
