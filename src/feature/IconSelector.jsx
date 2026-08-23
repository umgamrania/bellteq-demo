import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { ICONS } from "../data/icons";
import styles from "./IconSelector.module.css";

export default function IconSelector({
    onSelect,
    icons = ICONS,
}) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredIcons = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return icons;

        return icons.filter(
            (icon) =>
                icon.id.toLowerCase().includes(query) ||
                icon.name.toLowerCase().includes(query)
        );
    }, [icons, searchQuery]);

    const handleSelect = (icon) => {
        // Will be wired to sidebar context
        onSelect?.(icon);
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>
                    <Search size={14} />
                </span>
                <input
                    type="text"
                    placeholder="Search icons (e.g. 1A, 20)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                    aria-label="Search icons"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className={styles.clearButton}
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className={styles.header}>
                <span className={styles.title}>All Icons</span>
                <span className={styles.badge}>{filteredIcons.length}</span>
            </div>

            {filteredIcons.length > 0 ? (
                <div className={styles.grid}>
                    {filteredIcons.map((icon) => (
                        <button
                            key={icon.id}
                            type="button"
                            className={styles.card}
                            onClick={() => handleSelect(icon)}
                            aria-label={`Select ${icon.name}`}
                            title={icon.name}
                        >
                            <div className={styles.imageWrapper}>
                                <img
                                    src={icon.src}
                                    alt={icon.name}
                                    className={styles.image}
                                    loading="lazy"
                                />
                            </div>
                            <span className={styles.label}>{icon.id}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    No icons found matching "{searchQuery}"
                </div>
            )}
        </div>
    );
}
