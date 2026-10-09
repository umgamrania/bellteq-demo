import { useContext, useState, useRef, useCallback } from "react";
import {
    ShoppingCart,
    Trash2,
    SquarePen,
    FileText,
    Loader2,
    Pencil,
    Check,
    X,
    PackageOpen,
    RotateCcw,
    Tag,
    Percent,
    Wrench,
    Wifi,
    Zap,
    Plus,
    Minus,
    PackagePlus,
} from "lucide-react";
import { cartContext } from "../../context/cart";
import { boardContext } from "../../context/board";
import { sidebarContext } from "../../context/sidebar";
import { pricingContext } from "../../context/pricing";
import { companyContext } from "../../context/company";
import { COMPANY_INFO } from "../../data/companyInfo";
import { ACCESSORY_MAP } from "../../data/accessories";
import PdfBomModal from "../modal/PdfBomModal";
import styles from "./CartTab.module.css";

const GST_OPTIONS = [
    { label: "No tax (0%)", value: 0 },
    { label: "5%", value: 5 },
    { label: "9%", value: 9 },
    { label: "12%", value: 12 },
    { label: "18% (Standard)", value: 18 },
    { label: "28%", value: 28 },
    { label: "Custom", value: "custom" },
];

/** Per-item row — shows raw subtotal (no tax) */
function CartItemRow({ item, isActive, onLoad, onRemove, onRename, formatPrice, calculateBreakdown }) {
    const [isEditing, setIsEditing] = useState(false);
    const [nameInput, setNameInput] = useState(item.name);
    const inputRef = useRef(null);

    const cfg = item.config;
    const breakdown = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material, cfg?.accessories);
    const componentCount = breakdown.totalComponentCount || 0;
    const backplateName = cfg?.backplate?.name || "—";

    const commitRename = () => {
        const trimmed = nameInput.trim();
        if (trimmed && trimmed !== item.name) {
            onRename(item.cartId, trimmed);
        } else {
            setNameInput(item.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") commitRename();
        if (e.key === "Escape") { setNameInput(item.name); setIsEditing(false); }
    };

    const startEdit = () => {
        setNameInput(item.name);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 30);
    };

    const addedDate = item.addedAt
        ? new Date(item.addedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : "";

    return (
        <div className={`${styles.cartItem} ${isActive ? styles.activeCartItem : ""}`}>
            {/* Thumbnail */}
            <div className={styles.thumbBox}>
                {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.name} />
                ) : (
                    <PackageOpen size={20} className={styles.thumbPlaceholder} />
                )}
            </div>

            {/* Info */}
            <div className={styles.itemInfo}>
                {isEditing ? (
                    <div className={styles.renameRow}>
                        <input
                            ref={inputRef}
                            className={styles.nameInput}
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={commitRename}
                            maxLength={40}
                            autoFocus
                        />
                        <button type="button" className={styles.iconBtn} onClick={commitRename} title="Save name">
                            <Check size={13} />
                        </button>
                        <button type="button" className={styles.iconBtn} onClick={() => { setNameInput(item.name); setIsEditing(false); }} title="Cancel">
                            <X size={13} />
                        </button>
                    </div>
                ) : (
                    <div className={styles.nameRow}>
                        <span className={styles.itemName}>{item.name}</span>
                        {isActive && <span className={styles.activeBadge}>Editing</span>}
                        <button type="button" className={styles.editNameBtn} onClick={startEdit} title="Rename">
                            <Pencil size={12} />
                        </button>
                    </div>
                )}
                <span className={styles.itemMeta}>
                    {backplateName} · {componentCount} component{componentCount !== 1 ? "s" : ""}
                    {addedDate ? ` · ${addedDate}` : ""}
                </span>
                {/* Show raw subtotal — tax is applied once on the whole cart */}
                <span className={styles.itemPrice}>{formatPrice(breakdown.rawSubtotal)}</span>
            </div>

            {/* Actions */}
            <div className={styles.itemActions}>
                <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.loadBtn} ${isActive ? styles.activeLoadBtn : ""}`}
                    onClick={() => onLoad(item)}
                    title={isActive ? "Reload this board in editor" : "Edit board in designer"}
                    aria-label="Edit board"
                >
                    <SquarePen size={14} />
                </button>
                <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.removeBtn}`}
                    onClick={() => onRemove(item.cartId)}
                    title="Remove from cart"
                    aria-label="Remove from cart"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

/** Apply discount/GST/misc once on a combined raw subtotal */
function applyCartTax(rawTotal, discount, gstRate, miscCost) {
    let discountAmount = 0;
    if (discount && discount.value > 0) {
        discountAmount = discount.type === "percent"
            ? rawTotal * (discount.value / 100)
            : Math.min(discount.value, rawTotal);
    }
    const miscCostAmount = miscCost || 0;
    // GST applied AFTER, ON TOP OF misc charges and discounts
    const taxableAmount = Math.max(0, rawTotal - discountAmount + miscCostAmount);
    const gstAmount = taxableAmount * ((gstRate || 0) / 100);
    const finalTotal = taxableAmount + gstAmount;
    return { discountAmount, taxableAmount, gstAmount, miscCostAmount, finalTotal };
}

export default function CartTab({ onSwitchToBreakdown }) {
    const {
        cartItems,
        cartCount,
        removeFromCart,
        clearCart,
        updateCartItemName,
        activeCartId,
        setActiveCartId,
        additionalAccessories,
        updateAdditionalAccessoryQty,
    } = useContext(cartContext);
    const { loadConfiguration } = useContext(boardContext);
    const { setActiveIdx } = useContext(sidebarContext) || {};
    const {
        formatPrice,
        calculateBreakdown,
        getAccessoryPrice,
        gstRate,
        setGstRate,
        discount,
        setDiscount,
        miscCost,
        setMiscCost,
    } = useContext(pricingContext);
    const { companyInfo } = useContext(companyContext) || {};

    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isBomModalOpen, setIsBomModalOpen] = useState(false);

    // GST custom controls
    const [isCustomGst, setIsCustomGst] = useState(() => {
        const isPreset = [0, 5, 9, 12, 18, 28].includes(gstRate);
        return !isPreset;
    });
    const [customGstInput, setCustomGstInput] = useState(() => (![0, 5, 9, 12, 18, 28].includes(gstRate) ? String(gstRate) : ""));

    // Discount custom controls
    const [discountMode, setDiscountMode] = useState(() => {
        if (discount.value === 0) return "none";
        if (discount.type === "percent" && [5, 10, 15, 20].includes(discount.value)) {
            return `${discount.value}%`;
        }
        return discount.type === "percent" ? "custom_percent" : "custom_flat";
    });
    const [customDiscountInput, setCustomDiscountInput] = useState(() => (discount.value > 0 ? String(discount.value) : ""));

    // Misc cost input
    const [miscCostInput, setMiscCostInput] = useState(() => (miscCost > 0 ? String(miscCost) : ""));

    const handleMiscCostChange = (e) => {
        const val = e.target.value;
        setMiscCostInput(val);
        const num = parseFloat(val);
        setMiscCost(isNaN(num) || num < 0 ? 0 : num);
    };

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

    const currentGstSelectValue = isCustomGst ? "custom" : String(gstRate);

    // Accessory unit prices
    const wifiPrice = getAccessoryPrice ? getAccessoryPrice("wifi-chip") : 500;
    const hiLoadPrice = getAccessoryPrice ? getAccessoryPrice("hi-load") : 800;

    const additionalWifiQty = additionalAccessories?.["wifi-chip"] || 0;
    const additionalHiLoadQty = additionalAccessories?.["hi-load"] || 0;
    const additionalWifiTotal = additionalWifiQty * wifiPrice;
    const additionalHiLoadTotal = additionalHiLoadQty * hiLoadPrice;
    const additionalAccessoriesTotal = additionalWifiTotal + additionalHiLoadTotal;

    // Sum raw subtotals across all boards (no per-board tax)
    const rawBoardsSubtotal = cartItems.reduce((sum, item) => {
        const cfg = item.config;
        const bd = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material, cfg?.accessories);
        return sum + (bd.rawSubtotal || 0);
    }, 0);

    // Combined subtotal including additional accessories
    const rawGrandSubtotal = rawBoardsSubtotal + additionalAccessoriesTotal;

    // Apply tax/discount/misc once on the combined subtotal
    const { discountAmount, taxableAmount, gstAmount, miscCostAmount, finalTotal: cartFinalTotal } =
        applyCartTax(rawGrandSubtotal, discount, gstRate, miscCost);

    const handleLoad = useCallback((item) => {
        const isCurrent = item.cartId === activeCartId;
        const msg = isCurrent
            ? `Reload original saved version of "${item.name}"?\n\nAny unsaved changes in the editor will be replaced.`
            : `Load "${item.name}" into the editor?\n\nYour current board in the editor will be replaced.`;
        const confirmed = window.confirm(msg);
        if (!confirmed) return;
        loadConfiguration(item.config, 0);
        setActiveCartId(item.cartId);
        if (setActiveIdx) setActiveIdx(0);
        if (onSwitchToBreakdown) onSwitchToBreakdown();
    }, [loadConfiguration, setActiveCartId, activeCartId, setActiveIdx, onSwitchToBreakdown]);

    const handleRemove = useCallback((cartId) => {
        removeFromCart(cartId);
    }, [removeFromCart]);

    // ── Combined PDF ─────────────────────────────────────────────────────────
    const handleExportPdf = async (includeBom = true, includeCompanyInfo = true) => {
        if (cartItems.length === 0) return;
        setIsExportingPdf(true);

        try {
            const today = new Date();
            const dateString = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

            const activeCompany = companyInfo || COMPANY_INFO;

            const webAndEmail = [activeCompany?.email, activeCompany?.website].filter(Boolean).join(" &nbsp;·&nbsp; ");
            const contactParts = [];
            if (webAndEmail) contactParts.push(webAndEmail);
            if (activeCompany?.phone) contactParts.push(activeCompany.phone);

            const docTitle = activeCompany?.quotationTitle || "QUOTATION";
            const docValidity = activeCompany?.validity || "30 Days";
            const companyName = activeCompany?.name || "BELLATEQ SMART LIVING";
            const companyTagline = activeCompany?.tagline || "";
            const companyGstin = activeCompany?.gstin || "";
            const companyAddress = activeCompany?.address || "";


            let boardSectionsHtml = "";
            let combinedRawSubtotal = 0;

            for (let i = 0; i < cartItems.length; i++) {
                const item = cartItems[i];
                const cfg = item.config;
                const bd = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material, cfg?.accessories);
                combinedRawSubtotal += bd.rawSubtotal || 0;

                let serialNo = 1;
                let rowsHtml = "";

                if (bd.backplateItem) {
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                            <td>
                                <span class="item-name">${bd.backplateItem.name}</span>
                                <span class="item-sub">Modular Backplate · ${bd.backplateItem.slots} slots · ${bd.backplateItem.rows} row${bd.backplateItem.rows > 1 ? "s" : ""}</span>
                            </td>
                            <td class="cat-cell">Backplate</td>
                            <td style="text-align:center;">1</td>
                            <td style="text-align:right;">${formatPrice(bd.backplateItem.unitPrice)}</td>
                            <td class="amount-cell">${formatPrice(bd.backplateItem.unitPrice)}</td>
                        </tr>`;
                }

                for (const comp of bd.componentItems) {
                    const catLabel = comp.category === "switches" ? "Switch" : comp.category === "plugs" ? "Power Socket" : "Module";
                    const specLabel = comp.category === "switches"
                        ? `${comp.slots} button${comp.slots > 1 ? "s" : ""} per module`
                        : `${comp.slots} slot${comp.slots > 1 ? "s" : ""} per module`;
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                            <td>
                                <span class="item-name">${comp.name}</span>
                                <span class="item-sub">${specLabel}</span>
                            </td>
                            <td class="cat-cell">${catLabel}</td>
                            <td style="text-align:center;">${comp.count}</td>
                            <td style="text-align:right;">${formatPrice(comp.unitPrice)}</td>
                            <td class="amount-cell">${formatPrice(comp.totalPrice)}</td>
                        </tr>`;
                }

                if (bd.materialItem && bd.materialItem.unitPrice > 0) {
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                            <td>
                                <span class="item-name">${bd.materialItem.name} Finish</span>
                                <span class="item-sub">Custom Surface Finish Treatment</span>
                            </td>
                            <td class="cat-cell">Surface Finish</td>
                            <td style="text-align:center;">1</td>
                            <td style="text-align:right;">${formatPrice(bd.materialItem.unitPrice)}</td>
                            <td class="amount-cell">${formatPrice(bd.materialItem.unitPrice)}</td>
                        </tr>`;
                }

                if (bd.accessoryItems && bd.accessoryItems.length > 0) {
                    for (const acc of bd.accessoryItems) {
                        const accName = ACCESSORY_MAP[acc.id]?.name ?? acc.id;
                        rowsHtml += `
                            <tr>
                                <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                                <td>
                                    <span class="item-name">${accName}</span>
                                    <span class="item-sub">Board Accessory</span>
                                </td>
                                <td class="cat-cell">Accessory</td>
                                <td style="text-align:center;">${acc.qty}</td>
                                <td style="text-align:right;">${formatPrice(acc.unitPrice)}</td>
                                <td class="amount-cell">${formatPrice(acc.totalPrice)}</td>
                            </tr>`;
                    }
                }

                boardSectionsHtml += `
                    <div class="board-section">
                        <div class="board-header">
                            <span class="board-num">Board ${i + 1}</span>
                            <span class="board-name">${item.name}</span>
                        </div>
                        ${item.thumbnail ? `
                        <div class="preview-block">
                            <div class="preview-label">Board Design Preview</div>
                            <div class="preview-inner">
                                <img class="preview-img" src="${item.thumbnail}" alt="${item.name}" />
                            </div>
                            <div class="preview-footer">
                                <span class="preview-total-label">Board Total</span>
                                <span class="preview-total-val">${formatPrice(bd.rawSubtotal)}</span>
                            </div>
                        </div>` : `
                        <div class="preview-footer" style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 5px;">
                            <span class="preview-total-label">Board Total</span>
                            <span class="preview-total-val">${formatPrice(bd.rawSubtotal)}</span>
                        </div>`}
                        ${includeBom ? `
                        <div class="section-label">Bill of Materials</div>
                        <table class="bom-table">
                            <thead>
                                <tr>
                                    <th style="width:5%;text-align:center;">#</th>
                                    <th style="width:43%;">Description</th>
                                    <th style="width:16%;">Category</th>
                                    <th style="width:8%;text-align:center;">Qty</th>
                                    <th style="width:13%;text-align:right;">Unit Rate</th>
                                    <th style="width:15%;text-align:right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="5" style="text-align:right;">Board Subtotal</td>
                                    <td class="amount-cell">${formatPrice(bd.rawSubtotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        ` : ""}
                    </div>`;
            }

            if (additionalAccessoriesTotal > 0) {
                let accSerialNo = 1;
                let accRowsHtml = "";

                if (additionalWifiQty > 0) {
                    accRowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#9ca3af;">${accSerialNo++}</td>
                            <td>
                                <span class="item-name">WiFi Chip</span>
                                <span class="item-sub">Wi-Fi automation module for smart control</span>
                            </td>
                            <td class="cat-cell">Accessory</td>
                            <td style="text-align:center;">${additionalWifiQty}</td>
                            <td style="text-align:right;">${formatPrice(wifiPrice)}</td>
                            <td class="amount-cell">${formatPrice(additionalWifiTotal)}</td>
                        </tr>`;
                }

                if (additionalHiLoadQty > 0) {
                    accRowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#9ca3af;">${accSerialNo++}</td>
                            <td>
                                <span class="item-name">Hi Load</span>
                                <span class="item-sub">High-load capacity relay cell</span>
                            </td>
                            <td class="cat-cell">Accessory</td>
                            <td style="text-align:center;">${additionalHiLoadQty}</td>
                            <td style="text-align:right;">${formatPrice(hiLoadPrice)}</td>
                            <td class="amount-cell">${formatPrice(additionalHiLoadTotal)}</td>
                        </tr>`;
                }

                boardSectionsHtml += `
                    <div class="board-section">
                        <div class="board-header">
                            <span class="board-num">Accessories</span>
                            <span class="board-name">Additional Accessories</span>
                        </div>
                        ${includeBom ? `
                        <div class="section-label">Bill of Materials</div>
                        <table class="bom-table">
                            <thead>
                                <tr>
                                    <th style="width:5%;text-align:center;">#</th>
                                    <th style="width:43%;">Description</th>
                                    <th style="width:16%;">Category</th>
                                    <th style="width:8%;text-align:center;">Qty</th>
                                    <th style="width:13%;text-align:right;">Unit Rate</th>
                                    <th style="width:15%;text-align:right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>${accRowsHtml}</tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="5" style="text-align:right;">Additional Accessories Subtotal</td>
                                    <td class="amount-cell">${formatPrice(additionalAccessoriesTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        ` : `
                        <div class="preview-footer" style="margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px;">
                            <div>
                                ${additionalWifiQty > 0 ? `<div style="font-size: 11px; color: #374151;"><strong>WiFi Chip:</strong> ${additionalWifiQty} unit${additionalWifiQty > 1 ? "s" : ""} @ ${formatPrice(wifiPrice)}</div>` : ""}
                                ${additionalHiLoadQty > 0 ? `<div style="font-size: 11px; color: #374151; margin-top: 3px;"><strong>Hi Load:</strong> ${additionalHiLoadQty} unit${additionalHiLoadQty > 1 ? "s" : ""} @ ${formatPrice(hiLoadPrice)}</div>` : ""}
                            </div>
                            <div style="text-align: right;">
                                <span class="preview-total-label" style="display: block;">Accessories Subtotal</span>
                                <span class="preview-total-val">${formatPrice(additionalAccessoriesTotal)}</span>
                            </div>
                        </div>
                        `}
                    </div>`;

                combinedRawSubtotal += additionalAccessoriesTotal;
            }

            const cartTax = applyCartTax(combinedRawSubtotal, discount, gstRate, miscCost);

            const boardSummaryRows = cartItems.map((item, i) => {
                const cfg = item.config;
                const bd = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material, cfg?.accessories);
                return `<div class="s-row"><span>Board ${i + 1} \u2014 ${item.name}</span><span class="s-val">${formatPrice(bd.rawSubtotal)}</span></div>`;
            }).join("");

            const accessoriesSummaryRow = additionalAccessoriesTotal > 0
                ? `<div class="s-row"><span>Additional Accessories</span><span class="s-val">${formatPrice(additionalAccessoriesTotal)}</span></div>`
                : "";

            const grandSummaryHtml = `
                <div class="grand-summary-section">
                    <div class="summary-wrap">
                        <div class="summary-box">
                            <div class="summary-header">Price Breakdown \u2014 ${cartItems.length} Board${cartItems.length !== 1 ? "s" : ""}${additionalAccessoriesTotal > 0 ? " + Accessories" : ""}</div>
                            <div class="summary-body">
                                ${boardSummaryRows}
                                ${accessoriesSummaryRow}
                                <div class="s-rule"></div>
                                <div class="s-row"><span>Gross Subtotal</span><span class="s-val">${formatPrice(combinedRawSubtotal)}</span></div>
                                ${cartTax.discountAmount > 0 ? `
                                <div class="s-row s-discount">
                                    <span>Discount${discount.type === "percent" ? ` (${discount.value}%)` : " (Flat)"}</span>
                                    <span>\u2212 ${formatPrice(cartTax.discountAmount)}</span>
                                </div>` : ""}
                                ${cartTax.miscCostAmount > 0 ? `
                                <div class="s-row"><span>Other / Misc. Charges</span><span class="s-val">+ ${formatPrice(cartTax.miscCostAmount)}</span></div>` : ""}
                                ${(gstRate > 0 && (cartTax.discountAmount > 0 || cartTax.miscCostAmount > 0)) ? `
                                <div class="s-row"><span>Taxable Amount</span><span class="s-val">${formatPrice(cartTax.taxableAmount)}</span></div>` : ""}
                                ${(gstRate > 0 && cartTax.gstAmount > 0) ? `
                                <div class="s-row">
                                    <span>GST (${gstRate}%)</span>
                                    <span class="s-val">+ ${formatPrice(cartTax.gstAmount)}</span>
                                </div>` : ""}
                                <div class="s-rule"></div>
                                <div class="s-total">
                                    <span>Grand Total</span>
                                    <span>${formatPrice(cartTax.finalTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${companyName} \u2014 Combined ${docTitle}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                        @page { size: A4 portrait; margin: 14mm 16mm 20mm 16mm; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                            background: #fff; color: #1a1a2e;
                            font-size: 11.5px; line-height: 1.5;
                            max-width: 820px; margin: 0 auto;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #1a1a2e; margin-bottom: 18px; }
                        .company-name { font-size: 16px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #111827; margin-bottom: 3px; }
                        .company-tagline { font-size: 10px; color: #6b7280; margin-bottom: 5px; }
                        .company-contact { font-size: 9.5px; color: #9ca3af; line-height: 1.7; }
                        .company-gstin { font-size: 9.5px; color: #9ca3af; margin-top: 4px; }
                        .header-right { text-align: right; }
                        .doc-title { font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.02em; line-height: 1; margin-bottom: 12px; }
                        .meta-table { margin-left: auto; border-collapse: collapse; }
                        .meta-table td { padding: 2px 0 2px 14px; font-size: 10px; }
                        .meta-key { color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; text-align: right; }
                        .meta-val { color: #111827; font-weight: 600; text-align: right; }
                        .info-strip { display: flex; justify-content: space-between; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 7px 12px; margin-bottom: 22px; font-size: 10px; color: #6b7280; }
                        .info-strip strong { color: #374151; font-weight: 600; }
                        .board-section { margin-bottom: 32px; }
                        .board-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1.5px solid #1a1a2e; }
                        .board-num { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 6px; }
                        .board-name { font-size: 15px; font-weight: 700; color: #111827; flex: 1; }
                        .preview-block { margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 5px; overflow: hidden; }
                        .preview-label { background: #f3f4f6; border-bottom: 1px solid #e5e7eb; padding: 5px 12px; font-size: 9.5px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: #6b7280; }
                        .preview-inner { padding: 12px; text-align: center; }
                        .preview-img { max-height: 110px; max-width: 100%; object-fit: contain; display: block; margin: 0 auto; }
                        .preview-footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center; }
                        .preview-total-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #4b5563; }
                        .preview-total-val { font-size: 13px; font-weight: 700; color: #111827; }
                        .section-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 0; }
                        .bom-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #d1d5db; }
                        .bom-table th { background: #ffffff; color: #111827; font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 7px 10px; text-align: left; border: 1px solid #d1d5db; }
                        .bom-table td { padding: 6px 10px; font-size: 11px; color: #1f2937; border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; border-top: none; border-bottom: none; vertical-align: top; background: #ffffff; font-weight: 400; }
                        .item-name { display: block; font-weight: 400; color: #111827; }
                        .item-sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
                        .cat-cell { color: #4b5563; font-size: 10.5px; font-weight: 400; }
                        .amount-cell { text-align: right; font-weight: 400; color: #111827; }
                        .bom-table tfoot td { font-weight: 400; background: #ffffff; border: 1px solid #d1d5db; }
                        .grand-summary-section { margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a2e; }
                        .summary-wrap { display: flex; justify-content: flex-end; }
                        .summary-box { width: 310px; border: 1px solid #e5e7eb; border-radius: 5px; overflow: hidden; }
                        .summary-header { background: #f3f4f6; border-bottom: 1px solid #e5e7eb; padding: 6px 14px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: #6b7280; }
                        .summary-body { padding: 10px 14px 12px; }
                        .s-row { display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 5px; }
                        .s-val { font-weight: 600; color: #374151; }
                        .s-row.s-discount { color: #166534; }
                        .s-rule { height: 1px; background: #e5e7eb; margin: 8px 0; }
                        .s-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 700; color: #111827; }
                        .doc-footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9.5px; color: #9ca3af; letter-spacing: 0.02em; }
                        @media print {
                            html, body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                            .board-section { break-inside: avoid; }
                            .grand-summary-section { break-inside: avoid; }
                            .doc-footer { break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            ${includeCompanyInfo ? `
                            <div class="company-name">${companyName}</div>
                            ${companyTagline ? `<div class="company-tagline">${companyTagline}</div>` : ""}
                            <div class="company-contact">${contactParts.join("<br>")}</div>
                            ${companyGstin ? `<div class="company-gstin">GSTIN: ${companyGstin}</div>` : ""}
                            ${companyAddress ? `<div class="company-gstin">${companyAddress}</div>` : ""}
                            ` : ""}
                        </div>
                        <div class="header-right">
                            <div class="doc-title">${docTitle}</div>
                            <table class="meta-table">
                                <tr><td class="meta-key">Date</td><td class="meta-val">${dateString}</td></tr>
                                <tr><td class="meta-key">Boards</td><td class="meta-val">${cartItems.length}</td></tr>
                                ${additionalAccessoriesTotal > 0 ? `<tr><td class="meta-key">Accessories</td><td class="meta-val">${additionalWifiQty + additionalHiLoadQty} unit${(additionalWifiQty + additionalHiLoadQty) > 1 ? "s" : ""}</td></tr>` : ""}
                                <tr><td class="meta-key">Valid For</td><td class="meta-val">${docValidity}</td></tr>
                            </table>
                        </div>
                    </div>
                    ${boardSectionsHtml}
                    ${grandSummaryHtml}
                    <div class="doc-footer">
                        This is a computer-generated quote.
                    </div>
                </body>
                </html>`;

            const iframe = document.createElement("iframe");
            iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
            document.body.appendChild(iframe);
            const iDoc = iframe.contentWindow.document;
            iDoc.open(); iDoc.write(printContent); iDoc.close();
            setTimeout(() => {
                try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
                finally { setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 2000); }
            }, 350);
        } catch (err) {
            console.error("Error generating combined PDF:", err);
            alert("Failed to generate combined PDF quotation.");
        } finally {
            setIsExportingPdf(false);
        }
    };
    if (cartCount === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><ShoppingCart size={24} /></div>
                <h3>Your cart is empty</h3>
                <p className={styles.emptyHint}>
                    Design a board, then use <strong>"Add to Cart"</strong> in Step 6 (Export) to save it here.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.cartContainer}>
            <div className={styles.cartList}>
                {cartItems.map((item) => (
                    <CartItemRow
                        key={item.cartId}
                        item={item}
                        isActive={item.cartId === activeCartId}
                        onLoad={handleLoad}
                        onRemove={handleRemove}
                        onRename={updateCartItemName}
                        formatPrice={formatPrice}
                        calculateBreakdown={calculateBreakdown}
                    />
                ))}

                {/* Additional Accessories Card */}
                <div className={styles.additionalAccessoriesCard}>
                    <div className={styles.additionalAccessoriesHeader}>
                        <div className={styles.additionalAccessoriesTitleGroup}>
                            <PackagePlus size={14} className={styles.additionalAccessoriesIcon} />
                            <span className={styles.additionalAccessoriesTitle}>Additional Accessories</span>
                        </div>
                        {additionalAccessoriesTotal > 0 && (
                            <span className={styles.additionalAccessoriesBadge}>
                                +{formatPrice(additionalAccessoriesTotal)}
                            </span>
                        )}
                    </div>
                    <p className={styles.additionalAccessoriesHint}>
                        Add extra unassigned accessories to the overall quotation.
                    </p>

                    <div className={styles.additionalAccessoriesList}>
                        {/* WiFi Chip */}
                        <div className={`${styles.accRow} ${additionalWifiQty > 0 ? styles.accRowActive : ""}`}>
                            <div className={styles.accLeft}>
                                <div className={`${styles.accIconBox} ${additionalWifiQty > 0 ? styles.accIconBoxActive : ""}`}>
                                    <Wifi size={14} />
                                </div>
                                <div className={styles.accInfo}>
                                    <span className={styles.accName}>WiFi Chip</span>
                                    <span className={styles.accPrice}>{formatPrice(wifiPrice)} each</span>
                                </div>
                            </div>
                            <div className={styles.accStepper}>
                                <button
                                    type="button"
                                    className={styles.accStepBtn}
                                    onClick={() => updateAdditionalAccessoryQty("wifi-chip", additionalWifiQty - 1)}
                                    disabled={additionalWifiQty <= 0}
                                    aria-label="Decrease WiFi Chip"
                                >
                                    <Minus size={12} />
                                </button>
                                <span className={`${styles.accQty} ${additionalWifiQty > 0 ? styles.accQtyActive : ""}`}>
                                    {additionalWifiQty}
                                </span>
                                <button
                                    type="button"
                                    className={styles.accStepBtn}
                                    onClick={() => updateAdditionalAccessoryQty("wifi-chip", additionalWifiQty + 1)}
                                    aria-label="Increase WiFi Chip"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Hi Load Cell */}
                        <div className={`${styles.accRow} ${additionalHiLoadQty > 0 ? styles.accRowActive : ""}`}>
                            <div className={styles.accLeft}>
                                <div className={`${styles.accIconBox} ${additionalHiLoadQty > 0 ? styles.accIconBoxActive : ""}`}>
                                    <Zap size={14} />
                                </div>
                                <div className={styles.accInfo}>
                                    <span className={styles.accName}>Hi Load</span>
                                    <span className={styles.accPrice}>{formatPrice(hiLoadPrice)} each</span>
                                </div>
                            </div>
                            <div className={styles.accStepper}>
                                <button
                                    type="button"
                                    className={styles.accStepBtn}
                                    onClick={() => updateAdditionalAccessoryQty("hi-load", additionalHiLoadQty - 1)}
                                    disabled={additionalHiLoadQty <= 0}
                                    aria-label="Decrease Hi Load"
                                >
                                    <Minus size={12} />
                                </button>
                                <span className={`${styles.accQty} ${additionalHiLoadQty > 0 ? styles.accQtyActive : ""}`}>
                                    {additionalHiLoadQty}
                                </span>
                                <button
                                    type="button"
                                    className={styles.accStepBtn}
                                    onClick={() => updateAdditionalAccessoryQty("hi-load", additionalHiLoadQty + 1)}
                                    aria-label="Increase Hi Load"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.cartFooter}>
                {/* Quotation-level Discount & GST Controls */}
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
                                <option value="custom_flat">Custom ₹</option>
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
                                        placeholder={discountMode === "custom_percent" ? "20" : "10"}
                                        className={styles.inlineNumberInput}
                                    />
                                    <span className={styles.inputSuffix}>
                                        {discountMode === "custom_percent" ? "%" : "₹"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Misc. Costs Row */}
                    <div className={styles.controlRow}>
                        <div className={styles.controlLabel}>
                            <Wrench size={13} className={styles.controlIcon} />
                            <span>Misc. Costs</span>
                        </div>
                        <div className={styles.miscInputWrapper}>
                            <span className={styles.inputSuffix}>₹</span>
                            <input
                                type="number"
                                min="0"
                                step="10"
                                value={miscCostInput}
                                onChange={handleMiscCostChange}
                                placeholder="0"
                                className={styles.inlineNumberInput}
                            />
                        </div>
                    </div>

                    {/* GST Rate Selector */}
                    <div className={`${styles.controlRow} ${styles.gstControlRow}`}>
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
                                        placeholder="00"
                                        className={styles.inlineNumberInput}
                                    />
                                    <span className={styles.inputSuffix}>%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Combined quotation summary card */}
                <div className={styles.taxSummaryCard}>
                    <div className={styles.taxRow}>
                        <span className={styles.taxLabel}>Boards Subtotal ({cartCount})</span>
                        <span className={styles.taxValue}>{formatPrice(rawBoardsSubtotal)}</span>
                    </div>

                    {additionalAccessoriesTotal > 0 && (
                        <div className={styles.taxRow}>
                            <span className={styles.taxLabel}>Additional Accessories</span>
                            <span className={styles.taxValue}>+{formatPrice(additionalAccessoriesTotal)}</span>
                        </div>
                    )}

                    {additionalAccessoriesTotal > 0 && (
                        <div className={styles.taxRow} style={{ color: "#374151", fontWeight: 600 }}>
                            <span className={styles.taxLabel} style={{ color: "#374151", fontWeight: 600 }}>Subtotal</span>
                            <span className={styles.taxValue}>{formatPrice(rawGrandSubtotal)}</span>
                        </div>
                    )}

                    {discountAmount > 0 && (
                        <div className={`${styles.taxRow} ${styles.discountRow}`}>
                            <span className={styles.taxLabel}>
                                Discount{discount.type === "percent" ? ` (${discount.value}%)` : " (Flat)"}
                            </span>
                            <span className={styles.discountVal}>-{formatPrice(discountAmount)}</span>
                        </div>
                    )}

                    {miscCostAmount > 0 && (
                        <div className={styles.taxRow}>
                            <span className={styles.taxLabel}>Misc. Costs</span>
                            <span className={styles.taxValue}>+{formatPrice(miscCostAmount)}</span>
                        </div>
                    )}

                    {(gstRate > 0 && (discountAmount > 0 || miscCostAmount > 0)) && (
                        <div className={styles.taxRow}>
                            <span className={styles.taxLabel}>Taxable Amount</span>
                            <span className={styles.taxValue}>{formatPrice(taxableAmount)}</span>
                        </div>
                    )}

                    {(gstRate > 0 && gstAmount > 0) && (
                        <div className={styles.taxRow}>
                            <span className={styles.taxLabel}>GST ({gstRate}%)</span>
                            <span className={styles.taxValue}>
                                +{formatPrice(gstAmount)}
                            </span>
                        </div>
                    )}

                    <div className={styles.taxDivider} />

                    <div className={styles.grandTotalRow}>
                        <span className={styles.grandTotalLabel}>Grand Total</span>
                        <span className={styles.grandTotalAmount}>{formatPrice(cartFinalTotal)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.pdfBtn}
                    onClick={() => setIsBomModalOpen(true)}
                    disabled={isExportingPdf}
                >
                    {isExportingPdf ? <Loader2 size={15} className={styles.spinner} /> : <FileText size={15} />}
                    {isExportingPdf ? "Generating…" : "PDF Quotation"}
                </button>

                <button type="button" className={styles.clearBtn} onClick={clearCart}>
                    <RotateCcw size={12} />
                    Clear Cart
                </button>
            </div>

            <PdfBomModal
                isOpen={isBomModalOpen}
                onClose={() => setIsBomModalOpen(false)}
                onConfirm={handleExportPdf}
                title="Quotation Options"
                description={`Choose whether to include the Bill of Materials (BOM) for all ${cartItems.length} boards.`}
            />
        </div>
    );
}
