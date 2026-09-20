import { useContext, useState } from "react";
import {
    Receipt,
    SlidersHorizontal,
    Layers,
    Cpu,
    Palette,
    Package,
    IndianRupee,
    X,
    ShoppingCart,
} from "lucide-react";
import { boardContext } from "../../context/board";
import { pricingContext } from "../../context/pricing";
import { cartContext } from "../../context/cart";
import { ACCESSORY_MAP } from "../../data/accessories";
import CartTab from "./CartTab";
import styles from "./PricingSidebar.module.css";

export default function PricingSidebar() {
    const { backplate, components, material, accessories } = useContext(boardContext);
    const {
        formatPrice,
        calculateBreakdown,
        setIsPricingModalOpen,
        isPricingSidebarOpen,
        setIsPricingSidebarOpen,
    } = useContext(pricingContext);
    const { cartCount } = useContext(cartContext);

    // "breakdown" | "cart"
    const [activeTab, setActiveTab] = useState("breakdown");

    // Calculate BOM & totals for current board
    const breakdown = calculateBreakdown(backplate, components, material, accessories);
    const hasBackplate = Boolean(breakdown.backplateItem);
    const hasComponents = breakdown.componentItems.length > 0;
    const hasMaterial = Boolean(breakdown.materialItem);
    const hasAccessories = breakdown.accessoryItems && breakdown.accessoryItems.length > 0;
    const hasAnyItem = hasBackplate || hasComponents || hasMaterial || hasAccessories;

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                type="button"
                className={`${styles.collapsedTrigger} ${isPricingSidebarOpen ? styles.triggerHidden : ""}`}
                onClick={() => setIsPricingSidebarOpen(true)}
                title="Open Cost Breakdown Sidebar"
                aria-label="Open Cost Breakdown"
            >
                <Receipt size={18} />
                <span className={styles.triggerBadge}>{formatPrice(breakdown.rawSubtotal)}</span>
                {cartCount > 0 && (
                    <span className={styles.triggerCartBadge}>{cartCount}</span>
                )}
            </button>

            {/* Backdrop overlay for mobile */}
            <div
                className={`${styles.backdrop} ${isPricingSidebarOpen ? styles.backdropOpen : ""}`}
                onClick={() => setIsPricingSidebarOpen(false)}
                aria-hidden="true"
            />

            {/* Animated Pricing Sidebar */}
            <aside className={`${styles.sidebar} ${isPricingSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>

                {/* Sidebar Top Header */}
                <div className={styles.header}>
                    {/* Tab switcher */}
                    <div className={styles.tabSwitcher}>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${activeTab === "breakdown" ? styles.tabBtnActive : ""}`}
                            onClick={() => setActiveTab("breakdown")}
                        >
                            <Receipt size={14} />
                            Breakdown
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${activeTab === "cart" ? styles.tabBtnActive : ""}`}
                            onClick={() => setActiveTab("cart")}
                        >
                            <ShoppingCart size={14} />
                            Cart
                            {cartCount > 0 && (
                                <span className={styles.cartCountBadge}>{cartCount}</span>
                            )}
                        </button>
                    </div>

                    {/* Right-side actions */}
                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            className={styles.configBtn}
                            onClick={() => setIsPricingModalOpen(true)}
                            title="Configure Unit Prices"
                            aria-label="Configure Unit Prices"
                        >
                            <SlidersHorizontal size={15} />
                            <span className={styles.configBtnText}>Pricing</span>
                        </button>
                        <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={() => setIsPricingSidebarOpen(false)}
                            title="Close"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── CART TAB ───────────────────────────────────────────── */}
                {activeTab === "cart" && <CartTab onSwitchToBreakdown={() => setActiveTab("breakdown")} />}

                {/* ── BREAKDOWN TAB ──────────────────────────────────────── */}
                {activeTab === "breakdown" && (
                    <>
                        {/* Scrollable Breakdown Content */}
                        <div className={styles.content}>
                            {!hasAnyItem ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <IndianRupee size={24} />
                                    </div>
                                    <h3>No items configured yet</h3>
                                    <button
                                        type="button"
                                        className={styles.configureShortcut}
                                        onClick={() => setIsPricingModalOpen(true)}
                                    >
                                        <SlidersHorizontal size={14} />
                                        Manage Price Catalog
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Backplate Item */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeading}>
                                            <span className={styles.sectionTitle}>
                                                <Layers size={14} />
                                                Backplate
                                            </span>
                                            {hasBackplate && (
                                                <span className={styles.sectionPrice}>
                                                    {formatPrice(breakdown.backplateItem.unitPrice)}
                                                </span>
                                            )}
                                        </div>

                                        {hasBackplate ? (
                                            <div className={styles.itemCard}>
                                                <div className={styles.thumbWrapper}>
                                                    <img
                                                        src={breakdown.backplateItem.src}
                                                        alt={breakdown.backplateItem.name}
                                                    />
                                                </div>
                                                <div className={styles.itemMeta}>
                                                    <span className={styles.itemName}>{breakdown.backplateItem.name}</span>
                                                    <span className={styles.itemDetails}>
                                                        {breakdown.backplateItem.slots} slots • {breakdown.backplateItem.rows} row{breakdown.backplateItem.rows > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                                <div className={styles.itemCostCol}>
                                                    <span className={styles.itemCostBold}>
                                                        {formatPrice(breakdown.backplateItem.unitPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.emptyNotice}>
                                                <span>No backplate chosen yet</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Components List */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeading}>
                                            <span className={styles.sectionTitle}>
                                                <Cpu size={14} />
                                                Components
                                            </span>
                                            <span className={styles.counterBadge}>
                                                {breakdown.totalComponentCount} items
                                            </span>
                                        </div>

                                        {hasComponents ? (
                                            <div className={styles.componentList}>
                                                {breakdown.componentItems.map((item) => (
                                                    <div key={item.id} className={styles.itemCard}>
                                                        <div className={styles.thumbWrapper}>
                                                            <img src={item.src} alt={item.name} />
                                                        </div>
                                                        <div className={styles.itemMeta}>
                                                            <div className={styles.nameRow}>
                                                                <span className={styles.itemName}>{item.name}</span>
                                                                <span className={styles.qtyBadge}>×{item.count}</span>
                                                            </div>
                                                            <span className={styles.itemDetails}>
                                                                {formatPrice(item.unitPrice)} each • {item.slots * item.count} slot{item.slots * item.count > 1 ? "s" : ""}
                                                            </span>
                                                        </div>
                                                        <div className={styles.itemCostCol}>
                                                            <span className={styles.itemCostBold}>
                                                                {formatPrice(item.totalPrice)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className={styles.subtotalRow}>
                                                    <span>Components Subtotal</span>
                                                    <span className={styles.subtotalVal}>
                                                        {formatPrice(breakdown.componentsSubtotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.emptyNotice}>
                                                <span>No components added yet</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Accessories */}
                                    {hasAccessories && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeading}>
                                                <span className={styles.sectionTitle}>
                                                    <Package size={14} />
                                                    Accessories
                                                </span>
                                                <span className={styles.sectionPrice}>
                                                    {formatPrice(breakdown.accessoriesCost)}
                                                </span>
                                            </div>
                                            <div className={styles.componentList}>
                                                {breakdown.accessoryItems.map((item) => {
                                                    const meta = ACCESSORY_MAP[item.id];
                                                    return (
                                                        <div key={item.id} className={styles.itemCard}>
                                                            <div className={styles.itemMeta}>
                                                                <div className={styles.nameRow}>
                                                                    <span className={styles.itemName}>{meta?.name ?? item.id}</span>
                                                                    <span className={styles.qtyBadge}>×{item.qty}</span>
                                                                </div>
                                                                <span className={styles.itemDetails}>
                                                                    {formatPrice(item.unitPrice)} each
                                                                </span>
                                                            </div>
                                                            <div className={styles.itemCostCol}>
                                                                <span className={styles.itemCostBold}>
                                                                    {formatPrice(item.totalPrice)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Material Finish */}
                                    {hasMaterial && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeading}>
                                                <span className={styles.sectionTitle}>
                                                    <Palette size={14} />
                                                    Material Finish
                                                </span>
                                                <span className={styles.sectionPrice}>
                                                    {breakdown.materialItem.unitPrice > 0
                                                        ? formatPrice(breakdown.materialItem.unitPrice)
                                                        : "Included"}
                                                </span>
                                            </div>
                                            <div className={styles.itemCard}>
                                                <div className={styles.swatchWrapper}>
                                                    <img
                                                        src={breakdown.materialItem.src}
                                                        alt={breakdown.materialItem.name}
                                                    />
                                                </div>
                                                <div className={styles.itemMeta}>
                                                    <span className={styles.itemName}>{breakdown.materialItem.name}</span>
                                                    <span className={styles.itemDetails}>Surface Finish</span>
                                                </div>
                                                <div className={styles.itemCostCol}>
                                                    <span className={styles.itemCostBold}>
                                                        {breakdown.materialItem.unitPrice > 0
                                                            ? formatPrice(breakdown.materialItem.unitPrice)
                                                            : "₹0.00"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Board Summary Footer */}
                        <div className={styles.footer}>
                            <div className={styles.summaryCard}>
                                <div className={styles.totalRow}>
                                    <div className={styles.totalLabelGroup}>
                                        <span className={styles.totalLabel}>Board Subtotal</span>
                                        <span className={styles.totalSub}>
                                            {hasAnyItem ? "Taxes & discounts applied in Cart" : "No items configured"}
                                        </span>
                                    </div>
                                    <span className={styles.totalAmount}>
                                        {formatPrice(breakdown.rawSubtotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}
