import { useContext } from "react";
import styles from "./ComponentSelector.module.css";
import { boardContext } from "../context/board";
import { pricingContext } from "../context/pricing";
import { COMPONENT_SECTIONS } from "../data/components";

export default function ComponentSelector({
    onSelect,
    sections = COMPONENT_SECTIONS,
}) {
    const { addComponent } = useContext(boardContext);
    const { getComponentPrice, formatPrice } = useContext(pricingContext) || {};

    const handleSelect = (component) => {
        addComponent(component);
        onSelect?.(component);
    };

    return (
        <div className={styles.container}>
            {sections.map((section) => (
                <section key={section.id} className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>{section.title}</h3>
                        <span className={styles.badge}>{section.items.length}</span>
                    </div>

                    <div className={styles.grid}>
                        {section.items.map((item) => {
                            const price = getComponentPrice ? getComponentPrice(item.id) : 0;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={styles.card}
                                    onClick={() => handleSelect(item)}
                                    aria-label={`Select ${item.name}`}
                                >
                                    <div className={styles.imageWrapper}>
                                        <img
                                            src={item.src}
                                            alt={item.name}
                                            className={styles.image}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <span className={styles.label}>{item.name}</span>
                                        {formatPrice && (
                                            <span className={styles.priceTag}>{formatPrice(price)}</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}
