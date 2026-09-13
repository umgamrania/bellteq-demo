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
} from "lucide-react";
import { cartContext } from "../../context/cart";
import { boardContext } from "../../context/board";
import { sidebarContext } from "../../context/sidebar";
import { pricingContext } from "../../context/pricing";
import { COMPANY_INFO } from "../../data/companyInfo";
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
    const breakdown = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material);
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
    } = useContext(cartContext);
    const { loadConfiguration } = useContext(boardContext);
    const { setActiveIdx } = useContext(sidebarContext) || {};
    const {
        formatPrice,
        calculateBreakdown,
        gstRate,
        setGstRate,
        discount,
        setDiscount,
        miscCost,
        setMiscCost,
    } = useContext(pricingContext);

    const [isExportingPdf, setIsExportingPdf] = useState(false);

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

    // Sum raw subtotals across all boards (no per-board tax)
    const rawGrandSubtotal = cartItems.reduce((sum, item) => {
        const cfg = item.config;
        const bd = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material);
        return sum + (bd.rawSubtotal || 0);
    }, 0);

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
    const handleExportPdf = async () => {
        if (cartItems.length === 0) return;
        setIsExportingPdf(true);

        try {
            const today = new Date();
            const dateString = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

            // Resolve company logo
            let logoUrl = "";
            if (COMPANY_INFO?.logoSrc) {
                const rawLogo = COMPANY_INFO.logoSrc.trim();
                if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://") || rawLogo.startsWith("data:")) {
                    logoUrl = rawLogo;
                } else {
                    logoUrl = new URL(rawLogo.replace(/^\.\//, "").replace(/^\//, ""), window.location.href).href;
                }
            }

            const contactPartsRow1 = [];
            if (COMPANY_INFO?.gstin) contactPartsRow1.push(`<strong>GSTIN:</strong> ${COMPANY_INFO.gstin}`);
            if (COMPANY_INFO?.email) contactPartsRow1.push(`<strong>Email:</strong> ${COMPANY_INFO.email}`);
            const contactPartsRow2 = [];
            if (COMPANY_INFO?.phone) contactPartsRow2.push(`<strong>Phone:</strong> ${COMPANY_INFO.phone}`);
            if (COMPANY_INFO?.website) contactPartsRow2.push(`<strong>Web:</strong> ${COMPANY_INFO.website}`);
            const contactLines = [
                contactPartsRow1.length > 0 ? contactPartsRow1.join(" &bull; ") : "",
                contactPartsRow2.length > 0 ? contactPartsRow2.join(" &bull; ") : "",
                COMPANY_INFO?.address ? `<span>${COMPANY_INFO.address}</span>` : "",
            ].filter(Boolean);
            const contactDetailsHtml = contactLines.join("<br/>");

            const docTitle = COMPANY_INFO?.quotationTitle || "QUOTATION";
            const docSubtitle = COMPANY_INFO?.quotationSubtitle || "PROFORMA ESTIMATE / BILL";
            const docValidity = COMPANY_INFO?.validity || "30 Days";
            const companyName = COMPANY_INFO?.name || "BELLATEQ SMART LIVING";

            // Build one section per board (raw BOM only, no tax summary per board)
            let boardSectionsHtml = "";
            let combinedRawSubtotal = 0;

            for (let i = 0; i < cartItems.length; i++) {
                const item = cartItems[i];
                const cfg = item.config;
                const bd = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material);
                combinedRawSubtotal += bd.rawSubtotal || 0;

                let serialNo = 1;
                let rowsHtml = "";

                if (bd.backplateItem) {
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#6b7280">${serialNo++}</td>
                            <td><strong>${bd.backplateItem.name}</strong>
                                <div style="font-size:11px;color:#6b7280;margin-top:2px">Modular Backplate · ${bd.backplateItem.slots} slots · ${bd.backplateItem.rows} row${bd.backplateItem.rows > 1 ? "s" : ""}</div>
                            </td>
                            <td style="color:#4b5563;font-size:12px">Backplate</td>
                            <td style="text-align:center;font-weight:600">1</td>
                            <td style="text-align:right">${formatPrice(bd.backplateItem.unitPrice)}</td>
                            <td style="text-align:right;font-weight:600">${formatPrice(bd.backplateItem.unitPrice)}</td>
                        </tr>`;
                }

                for (const comp of bd.componentItems) {
                    const catLabel = comp.category === "switches" ? "Switch" : comp.category === "plugs" ? "Power Socket" : "Module";
                    const specLabel = comp.category === "switches"
                        ? `${comp.slots} button${comp.slots > 1 ? "s" : ""} per module`
                        : `${comp.slots} slot${comp.slots > 1 ? "s" : ""} per module`;
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#6b7280">${serialNo++}</td>
                            <td><strong>${comp.name}</strong>
                                <div style="font-size:11px;color:#6b7280;margin-top:2px">${specLabel}</div>
                            </td>
                            <td style="color:#4b5563;font-size:12px">${catLabel}</td>
                            <td style="text-align:center;font-weight:600">${comp.count}</td>
                            <td style="text-align:right">${formatPrice(comp.unitPrice)}</td>
                            <td style="text-align:right;font-weight:600">${formatPrice(comp.totalPrice)}</td>
                        </tr>`;
                }

                if (bd.materialItem && bd.materialItem.unitPrice > 0) {
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#6b7280">${serialNo++}</td>
                            <td><strong>${bd.materialItem.name} Finish</strong>
                                <div style="font-size:11px;color:#6b7280;margin-top:2px">Custom Surface Finish Treatment</div>
                            </td>
                            <td style="color:#4b5563;font-size:12px">Surface Finish</td>
                            <td style="text-align:center;font-weight:600">1</td>
                            <td style="text-align:right">${formatPrice(bd.materialItem.unitPrice)}</td>
                            <td style="text-align:right;font-weight:600">${formatPrice(bd.materialItem.unitPrice)}</td>
                        </tr>`;
                }

                boardSectionsHtml += `
                    <div class="board-section">
                        <div class="board-header">
                            <span class="board-index">Board ${i + 1}</span>
                            <span class="board-name">${item.name}</span>
                            <span class="board-subtotal">Subtotal: ${formatPrice(bd.rawSubtotal)}</span>
                        </div>
                        ${item.thumbnail ? `
                        <div class="visual-section">
                            <div class="visual-title">Board Preview</div>
                            <img class="visual-image" src="${item.thumbnail}" alt="${item.name}" />
                        </div>` : ""}
                        <div class="section-heading">Bill of Materials</div>
                        <table class="bom-table">
                            <thead>
                                <tr>
                                    <th style="width:6%;text-align:center">#</th>
                                    <th style="width:44%">Item Description</th>
                                    <th style="width:16%">Category</th>
                                    <th style="width:8%;text-align:center">Qty</th>
                                    <th style="width:13%;text-align:right">Unit Rate</th>
                                    <th style="width:13%;text-align:right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                        <div class="board-raw-total">
                            Board Subtotal (before tax): <strong>${formatPrice(bd.rawSubtotal)}</strong>
                        </div>
                    </div>`;
            }

            // Apply tax/discount/misc ONCE on the combined subtotal
            const cartTax = applyCartTax(combinedRawSubtotal, discount, gstRate, miscCost);

            // Build per-board summary rows for the final section
            const boardSummaryRows = cartItems.map((item, i) => {
                const cfg = item.config;
                const bd = calculateBreakdown(cfg?.backplate, cfg?.components, cfg?.material);
                return `<div class="sum-row"><span>Board ${i + 1} — ${item.name}:</span><span class="sum-val">${formatPrice(bd.rawSubtotal)}</span></div>`;
            }).join("");

            const discountRow = cartTax.discountAmount > 0 ? `
                <div class="sum-row discount-row">
                    <span>Discount${discount.type === "percent" ? ` (${discount.value}%)` : " (Flat)"}:</span>
                    <span>-${formatPrice(cartTax.discountAmount)}</span>
                </div>` : "";

            const miscRow = cartTax.miscCostAmount > 0 ? `
                <div class="sum-row">
                    <span>Other / Misc. Charges:</span>
                    <span class="sum-val">+${formatPrice(cartTax.miscCostAmount)}</span>
                </div>` : "";

            const taxableRow = (cartTax.discountAmount > 0 || cartTax.miscCostAmount > 0) ? `
                <div class="sum-row">
                    <span>Taxable Subtotal:</span>
                    <span class="sum-val">${formatPrice(cartTax.taxableAmount)}</span>
                </div>` : "";

            const grandTotalSection = `
                <div class="grand-total-section">
                    <div class="section-heading" style="margin-bottom:10px">Combined Quotation Summary</div>
                    <div class="summary-card" style="max-width:340px;margin-left:auto">
                        ${boardSummaryRows}
                        <div class="divider" style="margin:6px 0"></div>
                        <div class="sum-row"><span>Gross Subtotal (${cartItems.length} boards):</span><span class="sum-val">${formatPrice(combinedRawSubtotal)}</span></div>
                        ${discountRow}
                        ${miscRow}
                        ${taxableRow}
                        <div class="sum-row">
                            <span>GST (${gstRate || 0}%):</span>
                            <span class="sum-val">${cartTax.gstAmount > 0 ? `+${formatPrice(cartTax.gstAmount)}` : "₹0.00"}</span>
                        </div>
                        <div class="divider"></div>
                        <div class="grand-total-row">
                            <span>Grand Total:</span>
                            <span>${formatPrice(cartTax.finalTotal)}</span>
                        </div>
                    </div>
                </div>`;

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${companyName} — Combined Quotation</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
                        @page { size: A4 portrait; margin: 10mm 12mm; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: #fff; color: #1f2937;
                            padding: 20px 24px; font-size: 12px; line-height: 1.4;
                            max-width: 860px; margin: 0 auto;
                        }
                        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
                        .header-left { vertical-align: top; text-align: left; width: 58%; }
                        .brand-logo-img { height: 46px; width: auto; max-width: 220px; object-fit: contain; filter: brightness(0); margin-bottom: 4px; display: block; }
                        .company-subname { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; color: #1e293b; margin-bottom: 2px; text-transform: uppercase; }
                        .company-details { font-size: 10px; color: #64748b; line-height: 1.45; }
                        .company-details strong { color: #334155; }
                        .header-right { vertical-align: top; text-align: right; width: 42%; }
                        .doc-title { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: .06em; text-transform: uppercase; line-height: 1.1; }
                        .doc-subtitle { font-size: 9px; font-weight: 700; letter-spacing: .1em; color: #94a3b8; text-transform: uppercase; margin-top: 2px; margin-bottom: 6px; }
                        .meta-grid-table { margin-left: auto; border-collapse: collapse; font-size: 11px; }
                        .meta-grid-table td { padding: 2px 0 2px 8px; }
                        .meta-th { text-align: right; color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
                        .meta-td { text-align: right; color: #0f172a; }
                        .header-divider { height: 1.5px; background: linear-gradient(90deg,#0f172a 0%,#cbd5e1 100%); margin: 10px 0 20px 0; }

                        .board-section { margin-bottom: 28px; page-break-after: always; }
                        .board-section:last-of-type { page-break-after: avoid; }
                        .board-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #111827; }
                        .board-index { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; }
                        .board-name { font-size: 16px; font-weight: 700; color: #111827; flex: 1; }
                        .board-subtotal { font-size: 12px; font-weight: 600; color: #4b5563; }
                        .visual-section { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; text-align: center; }
                        .visual-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; text-align: left; margin-bottom: 4px; }
                        .visual-image { max-height: 120px; max-width: 100%; object-fit: contain; margin: 0 auto; display: block; filter: drop-shadow(0 4px 10px rgba(0,0,0,.08)); }
                        .section-heading { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #111827; margin-bottom: 6px; }
                        .bom-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
                        .bom-table th { background: #f3f4f6; color: #374151; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 6px 10px; border-top: 1px solid #e5e7eb; border-bottom: 1.5px solid #d1d5db; text-align: left; }
                        .bom-table td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #1f2937; }
                        .bom-table tr:nth-child(even) { background: #fafafa; }
                        .board-raw-total { text-align: right; font-size: 12px; color: #4b5563; padding: 6px 0; }
                        .board-raw-total strong { color: #111827; }

                        .grand-total-section { margin-top: 32px; padding-top: 20px; border-top: 2px solid #111827; }
                        .summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
                        .sum-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; color: #4b5563; }
                        .sum-val { font-weight: 600; color: #111827; }
                        .discount-row { color: #16a34a; font-weight: 600; }
                        .divider { height: 1px; background: #e5e7eb; margin: 5px 0; }
                        .grand-total-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 800; color: #111827; padding-top: 4px; }

                        @media print {
                            html, body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                            .board-section { break-inside: avoid; }
                            .grand-total-section { break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <table class="header-table">
                        <tr>
                            <td class="header-left">
                                ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="brand-logo-img" />` : ""}
                                ${companyName ? `<div class="company-subname">${companyName}</div>` : ""}
                                ${contactDetailsHtml ? `<div class="company-details">${contactDetailsHtml}</div>` : ""}
                            </td>
                            <td class="header-right">
                                <div class="doc-title">${docTitle}</div>
                                <div class="doc-subtitle">${docSubtitle}</div>
                                <table class="meta-grid-table">
                                    <tr><td class="meta-th">Date:</td><td class="meta-td">${dateString}</td></tr>
                                    <tr><td class="meta-th">Boards:</td><td class="meta-td">${cartItems.length}</td></tr>
                                    <tr><td class="meta-th">Validity:</td><td class="meta-td">${docValidity}</td></tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    <div class="header-divider"></div>
                    ${boardSectionsHtml}
                    ${grandTotalSection}
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

    // ─────────────────────────────────────────────────────────────────────────

    if (cartCount === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><ShoppingCart size={24} /></div>
                <h3>Your cart is empty</h3>
                <p className={styles.emptyHint}>
                    Design a board, then use <strong>"Add to Cart"</strong> in Step 5 (Export) to save it here.
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
                        <span className={styles.taxLabel}>Subtotal ({cartCount} board{cartCount !== 1 ? "s" : ""})</span>
                        <span className={styles.taxValue}>{formatPrice(rawGrandSubtotal)}</span>
                    </div>

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

                    {(discountAmount > 0 || miscCostAmount > 0) && (
                        <div className={styles.taxRow}>
                            <span className={styles.taxLabel}>Taxable Amount</span>
                            <span className={styles.taxValue}>{formatPrice(taxableAmount)}</span>
                        </div>
                    )}

                    <div className={styles.taxRow}>
                        <span className={styles.taxLabel}>GST ({gstRate || 0}%)</span>
                        <span className={styles.taxValue}>
                            {gstAmount > 0 ? `+${formatPrice(gstAmount)}` : "₹0.00"}
                        </span>
                    </div>

                    <div className={styles.taxDivider} />

                    <div className={styles.grandTotalRow}>
                        <span className={styles.grandTotalLabel}>Grand Total</span>
                        <span className={styles.grandTotalAmount}>{formatPrice(cartFinalTotal)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.pdfBtn}
                    onClick={handleExportPdf}
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
        </div>
    );
}
