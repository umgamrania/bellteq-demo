import { useContext } from "react";
import { BACKPLATES } from "../data/backplates";
import styles from "./BackplateSelector.module.css";
import { boardContext } from "../context/board";
import { sidebarContext } from "../context/sidebar";
import { pricingContext } from "../context/pricing";

export default function BackplateSelector({
    onSelect,
    backplates = BACKPLATES,
}) {
    const { backplate: selectedBackplate, selectBackplate } = useContext(boardContext);
    const { setActiveIdx } = useContext(sidebarContext) || {};
    const { getBackplatePrice, formatPrice } = useContext(pricingContext) || {};

    const handleSelect = (backplate) => {
        selectBackplate(backplate);
        onSelect?.(backplate);
        setActiveIdx?.(1);
    };

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {backplates.map((backplate) => {
                    const isSelected = selectedBackplate?.id === backplate.id;
                    const price = getBackplatePrice ? getBackplatePrice(backplate.id) : 0;
                    return (
                        <button
                            key={backplate.id}
                            type="button"
                            className={`${styles.card} ${isSelected ? styles.selected : ""}`}
                            onClick={() => handleSelect(backplate)}
                            aria-label={`Select ${backplate.name}`}
                        >
                            <div className={styles.imageWrapper}>
                                <img
                                    src={backplate.src}
                                    alt={backplate.alt}
                                    className={styles.image}
                                    loading="lazy"
                                />
                            </div>
                            <div className={styles.cardFooter}>
                                <span className={styles.label}>{backplate.name}</span>
                                {formatPrice && (
                                    <span className={styles.priceTag}>{formatPrice(price)}</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
