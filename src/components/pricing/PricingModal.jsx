import { useState, useContext } from "react";
import { X, RotateCcw, Search, Check, SlidersHorizontal } from "lucide-react";
import { pricingContext } from "../../context/pricing";
import { BACKPLATES } from "../../data/backplates";
import { COMPONENT_SECTIONS } from "../../data/components";
import { MATERIALS } from "../../data/materials";
import styles from "./PricingModal.module.css";

export default function PricingModal() {
    const {
        prices,
        currency,
        isPricingModalOpen,
        setIsPricingModalOpen,
        updatePrice,
        resetPrices,
    } = useContext(pricingContext);

    const [activeTab, setActiveTab] = useState("backplates");
    const [searchQuery, setSearchQuery] = useState("");
    const [savedNotice, setSavedNotice] = useState(false);

    if (!isPricingModalOpen) return null;

    const handleClose = () => {
        setIsPricingModalOpen(false);
    };

    const handlePriceChange = (key, value) => {
        updatePrice(key, value);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    const handleReset = () => {
        if (window.confirm("Reset all prices to factory catalog defaults?")) {
            resetPrices();
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2000);
        }
    };

    const tabs = [
        { id: "backplates", label: "Backplates", count: BACKPLATES.length },
        { id: "switches", label: "Switches", count: COMPONENT_SECTIONS.find(s => s.id === "switches")?.items.length || 0 },
        { id: "plugs", label: "Plugs", count: COMPONENT_SECTIONS.find(s => s.id === "plugs")?.items.length || 0 },
        { id: "other", label: "Other Sockets", count: COMPONENT_SECTIONS.find(s => s.id === "other")?.items.length || 0 },
        { id: "materials", label: "Materials", count: MATERIALS.length },
    ];

    // Filter items based on search query and active tab
    const getItemsForCurrentTab = () => {
        const query = searchQuery.toLowerCase().trim();

        if (activeTab === "backplates") {
            return BACKPLATES.filter(b => !query || b.name.toLowerCase().includes(query)).map(b => ({
                key: `backplate_${b.id}`,
                id: b.id,
                name: b.name,
                specs: `${b.slots} slots • ${b.rows} row${b.rows > 1 ? "s" : ""}`,
                src: b.src,
                currentPrice: prices[`backplate_${b.id}`] ?? 0,
            }));
        }

        if (activeTab === "switches" || activeTab === "plugs" || activeTab === "other") {
            const section = COMPONENT_SECTIONS.find(s => s.id === activeTab);
            if (!section) return [];
            return section.items.filter(item => !query || item.name.toLowerCase().includes(query)).map(item => ({
                key: `component_${item.id}`,
                id: item.id,
                name: item.name,
                specs: `${item.slots} slot${item.slots > 1 ? "s" : ""}${item.icons ? ` • ${item.icons} icons` : ""}`,
                src: item.src,
                currentPrice: prices[`component_${item.id}`] ?? 0,
            }));
        }

        if (activeTab === "materials") {
            return MATERIALS.filter(m => !query || m.name.toLowerCase().includes(query)).map(m => ({
                key: `material_${m.id}`,
                id: m.id,
                name: m.name,
                specs: m.description,
                src: m.src,
                currentPrice: prices[`material_${m.id}`] ?? 0,
            }));
        }

        return [];
    };

    const currentItems = getItemsForCurrentTab();

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                {/* Modal Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <div className={styles.titleIcon}>
                            <SlidersHorizontal size={20} />
                        </div>
                        <div>
                            <h2>Pricing Configuration</h2>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={handleClose} aria-label="Close dialog">
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Tabs & Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.tabsList}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={styles.tabBadge}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchBox}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button className={styles.clearSearchBtn} onClick={() => setSearchQuery("")}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal Body / Items Grid */}
                <div className={styles.body}>
                    <div className={styles.itemsList}>
                        {currentItems.length === 0 ? (
                            <div className={styles.emptySearch}>
                                <p>No items found matching "{searchQuery}"</p>
                            </div>
                        ) : (
                            currentItems.map((item) => (
                                <div key={item.key} className={styles.itemRow}>
                                    <div className={styles.itemThumb}>
                                        <img src={item.src} alt={item.name} />
                                    </div>
                                    <div className={styles.itemInfo}>
                                        <span className={styles.itemName}>{item.name}</span>
                                        <span className={styles.itemSpecs}>{item.specs}</span>
                                    </div>
                                    <div className={styles.priceInputWrapper}>
                                        <span className={styles.currencyPrefix}>{currency}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={item.currentPrice === 0 ? "0" : (item.currentPrice || "")}
                                            onChange={(e) => handlePriceChange(item.key, e.target.value)}
                                            className={styles.priceInput}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <button type="button" className={styles.resetBtn} onClick={handleReset}>
                            <RotateCcw size={14} />
                            Reset Defaults
                        </button>
                        {savedNotice && (
                            <span className={styles.savedBadge}>
                                <Check size={12} /> Auto-saved to LocalStorage
                            </span>
                        )}
                    </div>
                    <button type="button" className={styles.saveBtn} onClick={handleClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
