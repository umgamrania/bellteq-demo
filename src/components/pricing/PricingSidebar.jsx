import { useContext, useState } from "react";
import {
    Receipt,
    SlidersHorizontal,
    Layers,
    Cpu,
    Palette,
    IndianRupee,
    FileText,
    Percent,
    Tag
} from "lucide-react";
import { boardContext } from "../../context/board";
import { pricingContext } from "../../context/pricing";
import styles from "./PricingSidebar.module.css";

const GST_OPTIONS = [
    { label: "No tax (0%)", value: 0 },
    { label: "5%", value: 5 },
    { label: "9%", value: 9 },
    { label: "12%", value: 12 },
    { label: "18% (Standard)", value: 18 },
    { label: "28%", value: 28 },
    { label: "Custom %", value: "custom" },
];

export default function PricingSidebar() {
    const { backplate, components, material } = useContext(boardContext);
    const {
        formatPrice,
        calculateBreakdown,
        gstRate,
        setGstRate,
        discount,
        setDiscount,
        setIsPricingModalOpen,
        isPricingSidebarOpen,
        setIsPricingSidebarOpen,
    } = useContext(pricingContext);

    const [isCustomGst, setIsCustomGst] = useState(() => {
        const isPreset = [0, 5, 9, 12, 18, 28].includes(gstRate);
        return !isPreset;
    });
    const [customGstInput, setCustomGstInput] = useState(() => (![0, 5, 9, 12, 18, 28].includes(gstRate) ? String(gstRate) : ""));

    const [discountMode, setDiscountMode] = useState(() => {
        if (discount.value === 0) return "none";
        if (discount.type === "percent" && [5, 10, 15, 20].includes(discount.value)) {
            return `${discount.value}%`;
        }
        return discount.type === "percent" ? "custom_percent" : "custom_flat";
    });
    const [customDiscountInput, setCustomDiscountInput] = useState(() => (discount.value > 0 ? String(discount.value) : ""));

    // Calculate BOM & totals
    const breakdown = calculateBreakdown(backplate, components, material);
    const hasBackplate = Boolean(breakdown.backplateItem);
    const hasComponents = breakdown.componentItems.length > 0;
    const hasMaterial = Boolean(breakdown.materialItem);
    const hasAnyItem = hasBackplate || hasComponents || hasMaterial;

    // GST Change handler
    const handleGstSelectChange = (e) => {
        const val = e.target.value;
        if (val === "custom") {
            setIsCustomGst(true);
            const num = parseFloat(customGstInput) || 0;
            setGstRate(num);
        } else {
            setIsCustomGst(false);
            setGstRate(Number(val));
        }
    };

    const handleCustomGstInputChange = (e) => {
        const val = e.target.value;
        setCustomGstInput(val);
        const num = parseFloat(val);
        setGstRate(isNaN(num) || num < 0 ? 0 : num);
    };

    // Discount Change handler
    const handleDiscountSelectChange = (e) => {
        const val = e.target.value;
        setDiscountMode(val);

        if (val === "none") {
            setDiscount({ type: "percent", value: 0 });
        } else if (val.endsWith("%") && val !== "custom_percent") {
            const num = parseFloat(val);
            setDiscount({ type: "percent", value: num });
        } else if (val === "custom_percent") {
            const num = parseFloat(customDiscountInput) || 0;
            setDiscount({ type: "percent", value: Math.min(100, Math.max(0, num)) });
        } else if (val === "custom_flat") {
            const num = parseFloat(customDiscountInput) || 0;
            setDiscount({ type: "flat", value: Math.max(0, num) });
        }
    };

    const handleCustomDiscountInputChange = (e) => {
        const val = e.target.value;
        setCustomDiscountInput(val);
        const num = parseFloat(val);
        const validNum = isNaN(num) || num < 0 ? 0 : num;

        if (discountMode === "custom_percent") {
            setDiscount({ type: "percent", value: Math.min(100, validNum) });
        } else if (discountMode === "custom_flat") {
            setDiscount({ type: "flat", value: validNum });
        }
    };

    if (!isPricingSidebarOpen) {
        return (
            <button
                type="button"
                className={styles.collapsedTrigger}
                onClick={() => setIsPricingSidebarOpen(true)}
                title="Open Cost Breakdown Sidebar"
                aria-label="Open Cost Breakdown"
            >
                <Receipt size={18} />
                <span className={styles.triggerBadge}>{formatPrice(breakdown.finalTotal)}</span>
            </button>
        );
    }

    const currentGstSelectValue = isCustomGst ? "custom" : String(gstRate);

    return (
        <aside className={styles.sidebar}>
            {/* Sidebar Top Header */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Receipt size={18} className={styles.headerIcon} />
                    <h2>Cost Breakdown</h2>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={styles.configBtn}
                        onClick={() => setIsPricingModalOpen(true)}
                        title="Configure Unit Prices"
                        aria-label="Configure Unit Prices"
                    >
                        <SlidersHorizontal size={15} />
                        <span>Pricing</span>
                    </button>
                </div>
            </div>

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

                        {/* 3. Material Finish */}
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

            {/* Sticky Pricing Adjustments & Summary Footer */}
            <div className={styles.footer}>
                {/* Discount & GST Configuration Controls */}
                <div className={styles.taxControlsCard}>
                    {/* Discount Selector */}
                    <div className={styles.controlRow}>
                        <div className={styles.controlLabel}>
                            <Tag size={13} className={styles.controlIcon} />
                            <span>Discount</span>
                        </div>
                        <div className={styles.controlInputsGroup}>
                            <select
                                value={discountMode}
                                onChange={handleDiscountSelectChange}
                                className={styles.selectInput}
                            >
                                <option value="none">No Discount</option>
                                <option value="5%">5% Off</option>
                                <option value="10%">10% Off</option>
                                <option value="15%">15% Off</option>
                                <option value="20%">20% Off</option>
                                <option value="custom_percent">Custom %</option>
                                <option value="custom_flat">Custom Amount</option>
                            </select>

                            {(discountMode === "custom_percent" || discountMode === "custom_flat") && (
                                <div className={styles.inlineNumberInputWrapper}>
                                    <input
                                        type="number"
                                        min="0"
                                        max={discountMode === "custom_percent" ? 100 : undefined}
                                        step={discountMode === "custom_percent" ? "1" : "50"}
                                        value={customDiscountInput}
                                        onChange={handleCustomDiscountInputChange}
                                        className={styles.inlineNumberInput}
                                    />
                                    <span className={styles.inputSuffix}>
                                        {discountMode === "custom_percent" ? "%" : "₹"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GST Rate Selector */}
                    <div className={styles.controlRow}>
                        <div className={styles.controlLabel}>
                            <Percent size={13} className={styles.controlIcon} />
                            <span>GST</span>
                        </div>
                        <div className={styles.controlInputsGroup}>
                            <select
                                value={currentGstSelectValue}
                                onChange={handleGstSelectChange}
                                className={styles.selectInput}
                            >
                                {GST_OPTIONS.map((opt) => (
                                    <option key={opt.label} value={String(opt.value)}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {isCustomGst && (
                                <div className={styles.inlineNumberInputWrapper}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={customGstInput}
                                        onChange={handleCustomGstInputChange}
                                        placeholder="Rate"
                                        className={styles.inlineNumberInput}
                                    />
                                    <span className={styles.inputSuffix}>%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bill Summary Breakdown Card */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Subtotal</span>
                        <span className={styles.summaryValue}>
                            {formatPrice(breakdown.rawSubtotal)}
                        </span>
                    </div>

                    {breakdown.discountAmount > 0 && (
                        <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                            <span className={styles.summaryLabel}>
                                Discount {breakdown.discount.type === "percent" ? `(${breakdown.discount.value}%)` : "(Flat)"}
                            </span>
                            <span className={styles.discountValue}>
                                -{formatPrice(breakdown.discountAmount)}
                            </span>
                        </div>
                    )}

                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>
                            GST ({breakdown.gstRate}%)
                        </span>
                        <span className={styles.summaryValue}>
                            {breakdown.gstAmount > 0 ? `+${formatPrice(breakdown.gstAmount)}` : "₹0.00"}
                        </span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.totalRow}>
                        <div className={styles.totalLabelGroup}>
                            <span className={styles.totalLabel}>Total Price</span>
                            <span className={styles.totalSub}>
                                {breakdown.gstRate > 0 ? `Includes ${breakdown.gstRate}% GST` : "No GST applied"}
                            </span>
                        </div>
                        <span className={styles.totalAmount}>
                            {formatPrice(breakdown.finalTotal)}
                        </span>
                    </div>
                </div>

                <div className={styles.footerActions}>
                    <button
                        type="button"
                        className={styles.primaryPdfBtn}
                        disabled={!hasAnyItem}
                        title="Generate PDF"
                    >
                        <FileText size={15} />
                        Generate PDF
                    </button>
                </div>
            </div>
        </aside>
    );
}
