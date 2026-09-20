import { useState, useContext, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import {
    Download,
    Image,
    FileText,
    Loader2,
    FileJson,
    Upload,
    ShoppingCart,
    Check,
    RotateCcw,
    Plus,
    RefreshCw,
} from "lucide-react";
import { boardContext } from "../context/board";
import { pricingContext } from "../context/pricing";
import { cartContext } from "../context/cart";
import { COMPANY_INFO } from "../data/companyInfo";
import { ACCESSORY_MAP } from "../data/accessories";
import PdfBomModal from "../components/modal/PdfBomModal";
import styles from "./ExportSelector.module.css";


export default function ExportSelector() {
    const { backplate, components, material, accessories, downloadConfiguration, importConfigFile, exportConfiguration, resetBoard } = useContext(boardContext);
    const { formatPrice, calculateBreakdown } = useContext(pricingContext);
    const { addToCart, updateCartItem, cartItems, activeCartId } = useContext(cartContext);

    const jsonFileInputRef = useRef(null);

    const [isExportingPng, setIsExportingPng] = useState(false);
    const [isExportingJpeg, setIsExportingJpeg] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isBomModalOpen, setIsBomModalOpen] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [cartNotice, setCartNotice] = useState(null); // 'added' | 'updated' | 'added_new' | null

    const activeCartItem = activeCartId ? cartItems.find((i) => i.cartId === activeCartId) : null;

    const handleLoadJson = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await importConfigFile(file);
        } catch (err) {
            alert("Failed to load configuration JSON: " + err.message);
        } finally {
            e.target.value = "";
        }
    };

    // Helper to capture a snapshot thumbnail of the current board
    const captureThumbnail = async () => {
        const node = document.getElementById("switchboard-board-container");
        if (node) {
            try {
                return await toPng(node, { pixelRatio: 1.5, cacheBust: true });
            } catch (e) {
                console.warn("Could not capture board thumbnail for cart:", e);
            }
        }
        return null;
    };

    // Update the currently loaded board in cart with new changes
    const handleUpdateCart = async () => {
        if (!backplate || !activeCartItem) return;
        setIsAddingToCart(true);
        try {
            const config = exportConfiguration();
            const thumbnail = await captureThumbnail();
            updateCartItem(activeCartItem.cartId, config, thumbnail);
            setCartNotice("updated");
            setTimeout(() => setCartNotice(null), 2500);
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Save as a new copy/entry in cart
    const handleSaveAsNewCart = async () => {
        if (!backplate) return;
        const defaultName = activeCartItem
            ? `${activeCartItem.name} (Copy)`
            : `Board ${cartItems.length + 1}`;
        const inputName = window.prompt("Enter a name for this board:", defaultName);
        if (inputName === null) return; // Cancelled
        const finalName = inputName.trim() || defaultName;

        setIsAddingToCart(true);
        try {
            const config = exportConfiguration();
            const thumbnail = await captureThumbnail();
            addToCart(config, finalName, thumbnail);
            setCartNotice("added_new");
            setTimeout(() => setCartNotice(null), 2500);
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Add brand new board to cart
    const handleAddToCart = async () => {
        if (!backplate) return;
        const defaultName = `Board ${cartItems.length + 1}`;
        const inputName = window.prompt("Enter a name for this board:", defaultName);
        if (inputName === null) return; // Cancelled
        const finalName = inputName.trim() || defaultName;

        setIsAddingToCart(true);
        try {
            const config = exportConfiguration();
            const thumbnail = await captureThumbnail();
            addToCart(config, finalName, thumbnail);
            setCartNotice("added");
            setTimeout(() => setCartNotice(null), 2500);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const breakdown = calculateBreakdown(backplate, components, material, accessories);
    const hasBackplate = Boolean(backplate?.src);


    // Download PNG with transparent background and high DPI
    const handleDownloadPng = async () => {
        const node = document.getElementById("switchboard-board-container");
        if (!node) {
            alert("No switchboard to download. Please select a backplate.");
            return;
        }

        setIsExportingPng(true);
        try {
            const dataUrl = await toPng(node, {
                pixelRatio: 3,
                cacheBust: true,
            });

            const link = document.createElement("a");
            const fileName = `switchboard-${backplate?.name ? backplate.name.toLowerCase().replace(/\s+/g, "-") : "design"}.png`;
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Error generating PNG image:", err);
            alert("Failed to export image. Please try again.");
        } finally {
            setIsExportingPng(false);
        }
    };

    // Download JPEG with clean white backdrop
    const handleDownloadJpeg = async () => {
        const node = document.getElementById("switchboard-board-container");
        if (!node) {
            alert("No switchboard to download. Please select a backplate.");
            return;
        }

        setIsExportingJpeg(true);
        try {
            const dataUrl = await toJpeg(node, {
                pixelRatio: 3,
                quality: 0.95,
                backgroundColor: "#ffffff",
                cacheBust: true,
            });

            const link = document.createElement("a");
            const fileName = `switchboard-${backplate?.name ? backplate.name.toLowerCase().replace(/\s+/g, "-") : "design"}.jpg`;
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Error generating JPEG image:", err);
            alert("Failed to export JPEG image. Please try again.");
        } finally {
            setIsExportingJpeg(false);
        }
    };

    // Print / PDF Quote Generation
    const handleDownloadPdf = async (includeBom = true) => {
        setIsExportingPdf(true);
        try {
            const node = document.getElementById("switchboard-board-container");
            let boardImageDataUrl = "";
            if (node) {
                try {
                    boardImageDataUrl = await toPng(node, {
                        pixelRatio: 2.5,
                        cacheBust: true,
                    });
                } catch (e) {
                    console.error("Failed to capture board image for PDF", e);
                }
            }

            const today = new Date();
            const dateString = today.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

            let serialNo = 1;
            let rowsHtml = "";

            // 1. Backplate Row
            if (breakdown.backplateItem) {
                rowsHtml += `
                    <tr>
                        <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                        <td>
                            <span class="item-name">${breakdown.backplateItem.name}</span>
                            <span class="item-sub">Modular Backplate · ${breakdown.backplateItem.slots} slots · ${breakdown.backplateItem.rows} row${breakdown.backplateItem.rows > 1 ? "s" : ""}</span>
                        </td>
                        <td class="cat-cell">Backplate</td>
                        <td style="text-align:center;">1</td>
                        <td style="text-align:right;">${formatPrice(breakdown.backplateItem.unitPrice)}</td>
                        <td class="amount-cell">${formatPrice(breakdown.backplateItem.unitPrice)}</td>
                    </tr>
                `;
            }

            // 2. Component Rows
            for (const item of breakdown.componentItems) {
                const catLabel = item.category === "switches" ? "Switch" : item.category === "plugs" ? "Power Socket" : "Module";
                const specLabel = item.category === "switches"
                    ? `${item.slots} button${item.slots > 1 ? "s" : ""} per module`
                    : `${item.slots} slot${item.slots > 1 ? "s" : ""} per module`;

                rowsHtml += `
                    <tr>
                        <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                        <td>
                            <span class="item-name">${item.name}</span>
                            <span class="item-sub">${specLabel}</span>
                        </td>
                        <td class="cat-cell">${catLabel}</td>
                        <td style="text-align:center;">${item.count}</td>
                        <td style="text-align:right;">${formatPrice(item.unitPrice)}</td>
                        <td class="amount-cell">${formatPrice(item.totalPrice)}</td>
                    </tr>
                `;
            }

            // 3. Material Row
            if (breakdown.materialItem && breakdown.materialItem.unitPrice > 0) {
                rowsHtml += `
                    <tr>
                        <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                        <td>
                            <span class="item-name">${breakdown.materialItem.name} Finish</span>
                            <span class="item-sub">Custom Surface Finish Treatment</span>
                        </td>
                        <td class="cat-cell">Surface Finish</td>
                        <td style="text-align:center;">1</td>
                        <td style="text-align:right;">${formatPrice(breakdown.materialItem.unitPrice)}</td>
                        <td class="amount-cell">${formatPrice(breakdown.materialItem.unitPrice)}</td>
                    </tr>
                `;
            }

            // 4. Accessory Rows
            if (breakdown.accessoryItems && breakdown.accessoryItems.length > 0) {
                for (const item of breakdown.accessoryItems) {
                    const accName = ACCESSORY_MAP[item.id]?.name ?? item.id;
                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;color:#9ca3af;">${serialNo++}</td>
                            <td>
                                <span class="item-name">${accName}</span>
                                <span class="item-sub">Board Accessory</span>
                            </td>
                            <td class="cat-cell">Accessory</td>
                            <td style="text-align:center;">${item.qty}</td>
                            <td style="text-align:right;">${formatPrice(item.unitPrice)}</td>
                            <td class="amount-cell">${formatPrice(item.totalPrice)}</td>
                        </tr>
                    `;
                }
            }

            // Resolve company branding logo URL
            let logoUrl = "";
            if (COMPANY_INFO?.logoSrc) {
                const rawLogo = COMPANY_INFO.logoSrc.trim();
                if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://") || rawLogo.startsWith("data:")) {
                    logoUrl = rawLogo;
                } else {
                    const cleanPath = rawLogo.replace(/^\.\//, "").replace(/^\//, "");
                    logoUrl = new URL(cleanPath, window.location.href).href;
                }
            }

            const webAndEmail = [COMPANY_INFO?.email, COMPANY_INFO?.website].filter(Boolean).join(" &nbsp;·&nbsp; ");
            const contactParts = [];
            if (webAndEmail) contactParts.push(webAndEmail);
            if (COMPANY_INFO?.phone) contactParts.push(COMPANY_INFO.phone);

            const docTitle = COMPANY_INFO?.quotationTitle || "QUOTATION";
            const docValidity = COMPANY_INFO?.validity || "30 Days";
            const companyName = COMPANY_INFO?.name || "BELLATEQ SMART LIVING";
            const companyTagline = COMPANY_INFO?.tagline || "";
            const companyGstin = COMPANY_INFO?.gstin || "";
            const companyAddress = COMPANY_INFO?.address || "";


            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${companyName} — ${docTitle}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                        @page {
                            size: A4 portrait;
                            margin: 14mm 16mm 20mm 16mm;
                        }

                        * { box-sizing: border-box; margin: 0; padding: 0; }

                        body {
                            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                            background: #ffffff;
                            color: #1a1a2e;
                            font-size: 11.5px;
                            line-height: 1.5;
                            max-width: 820px;
                            margin: 0 auto;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        /* ── Header ──────────────────────────── */
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding-bottom: 16px;
                            border-bottom: 2px solid #1a1a2e;
                            margin-bottom: 18px;
                        }
                        .logo-img {
                            height: 56px;
                            width: auto;
                            max-width: 220px;
                            object-fit: contain;
                            display: block;
                            margin-bottom: 8px;
                            filter: brightness(0);
                        }
                        .company-name {
                            font-size: 11.5px;
                            font-weight: 700;
                            letter-spacing: 0.07em;
                            text-transform: uppercase;
                            color: #111827;
                            margin-bottom: 2px;
                        }
                        .company-tagline {
                            font-size: 10px;
                            color: #6b7280;
                            margin-bottom: 5px;
                        }
                        .company-contact {
                            font-size: 9.5px;
                            color: #9ca3af;
                            line-height: 1.7;
                        }
                        .header-right { text-align: right; }
                        .doc-title {
                            font-size: 28px;
                            font-weight: 700;
                            color: #111827;
                            letter-spacing: -0.02em;
                            line-height: 1;
                            margin-bottom: 12px;
                        }
                        .meta-table { margin-left: auto; border-collapse: collapse; }
                        .meta-table td { padding: 2px 0 2px 14px; font-size: 10px; }
                        .meta-key {
                            color: #9ca3af;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            text-align: right;
                        }
                        .meta-val {
                            color: #111827;
                            font-weight: 600;
                            text-align: right;
                        }

                        /* ── Info strip ───────────────────────── */
                        .info-strip {
                            display: flex;
                            justify-content: space-between;
                            background: #f9fafb;
                            border: 1px solid #e5e7eb;
                            border-radius: 4px;
                            padding: 7px 12px;
                            margin-bottom: 20px;
                            font-size: 10px;
                            color: #6b7280;
                        }
                        .info-strip strong { color: #374151; font-weight: 600; }

                        /* ── Board preview ────────────────────── */
                        .preview-block {
                            margin-bottom: 20px;
                            border: 1px solid #e5e7eb;
                            border-radius: 5px;
                            overflow: hidden;
                        }
                        .preview-label {
                            background: #f3f4f6;
                            border-bottom: 1px solid #e5e7eb;
                            padding: 5px 12px;
                            font-size: 9.5px;
                            font-weight: 600;
                            letter-spacing: 0.09em;
                            text-transform: uppercase;
                            color: #6b7280;
                        }
                        .preview-inner { padding: 14px; text-align: center; }
                        .preview-img {
                            max-height: 130px;
                            max-width: 100%;
                            object-fit: contain;
                            display: block;
                            margin: 0 auto;
                        }

                        /* ── Section label ────────────────────── */
                        .section-label {
                            font-size: 9.5px;
                            font-weight: 700;
                            letter-spacing: 0.1em;
                            text-transform: uppercase;
                            color: #374151;
                            border-bottom: 1px solid #e5e7eb;
                            padding-bottom: 5px;
                            margin-bottom: 0;
                        }

                        /* ── BOM Table ────────────────────────── */
                        .bom-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 18px;
                            border: 1px solid #d1d5db;
                        }
                        .bom-table th {
                            background: #ffffff;
                            color: #111827;
                            font-size: 9.5px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            padding: 7px 10px;
                            text-align: left;
                            border: 1px solid #d1d5db;
                        }
                        .bom-table td {
                            padding: 6px 10px;
                            font-size: 11px;
                            color: #1f2937;
                            border-left: 1px solid #d1d5db;
                            border-right: 1px solid #d1d5db;
                            border-top: none;
                            border-bottom: none;
                            vertical-align: top;
                            background: #ffffff;
                            font-weight: 400;
                        }
                        .item-name { display: block; font-weight: 400; color: #111827; }
                        .item-sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
                        .cat-cell { color: #4b5563; font-size: 10.5px; font-weight: 400; }
                        .amount-cell { text-align: right; font-weight: 400; color: #111827; }
                        .bom-table tfoot td { font-weight: 400; background: #ffffff; border: 1px solid #d1d5db; }

                        /* ── Summary ──────────────────────────── */
                        .summary-wrap { display: flex; justify-content: flex-end; }
                        .summary-box {
                            width: 276px;
                            border: 1px solid #e5e7eb;
                            border-radius: 5px;
                            overflow: hidden;
                        }
                        .summary-header {
                            background: #f3f4f6;
                            border-bottom: 1px solid #e5e7eb;
                            padding: 6px 14px;
                            font-size: 9.5px;
                            font-weight: 700;
                            letter-spacing: 0.09em;
                            text-transform: uppercase;
                            color: #6b7280;
                        }
                        .summary-body { padding: 10px 14px 12px; }
                        .s-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 11px;
                            color: #6b7280;
                            margin-bottom: 5px;
                        }
                        .s-val { font-weight: 600; color: #374151; }
                        .s-row.s-discount { color: #166534; }
                        .s-rule { height: 1px; background: #e5e7eb; margin: 8px 0; }
                        .s-total {
                            display: flex;
                            justify-content: space-between;
                            align-items: baseline;
                            font-size: 14px;
                            font-weight: 700;
                            color: #111827;
                        }

                        /* ── Footer ───────────────────────────── */
                        .doc-footer {
                            margin-top: 36px;
                            padding-top: 12px;
                            border-top: 1px solid #e5e7eb;
                            text-align: center;
                            font-size: 9.5px;
                            color: #9ca3af;
                            letter-spacing: 0.02em;
                        }

                        @media print {
                            html, body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                            .preview-block, .summary-wrap, .doc-footer { break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <!-- Header -->
                    <div class="header">
                        <div>
                            ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo-img" />` : ""}
                            ${!logoUrl ? `<div class="company-name">${companyName}</div>` : ""}
                            ${companyTagline ? `<div class="company-tagline">${companyTagline}</div>` : ""}
                            <div class="company-contact">${contactParts.join("<br>")}</div>
                            ${companyGstin ? `<div class="company-gstin">GSTIN: ${companyGstin}</div>` : ""}
                            ${companyAddress ? `<div class="company-gstin">${companyAddress}</div>` : ""}
                        </div>
                        <div class="header-right">
                            <div class="doc-title">${docTitle}</div>
                            <table class="meta-table">
                                <tr><td class="meta-key">Date</td><td class="meta-val">${dateString}</td></tr>
                                <tr><td class="meta-key">Valid For</td><td class="meta-val">${docValidity}</td></tr>
                            </table>
                        </div>
                    </div>

                    <!-- Info strip -->

                    <!-- Board Preview -->
                    ${boardImageDataUrl ? `
                    <div class="preview-block">
                        <div class="preview-label">Board Design Preview</div>
                        <div class="preview-inner">
                            <img class="preview-img" src="${boardImageDataUrl}" alt="Board Preview" />
                        </div>
                    </div>` : ""}

                    <!-- BOM -->
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
                                <td class="amount-cell">${formatPrice(breakdown.rawSubtotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    ` : ""}

                    <!-- Summary -->
                    <div class="summary-wrap">
                        <div class="summary-box">
                            <div class="summary-header">Price Summary</div>
                            <div class="summary-body">
                                <div class="s-row"><span>Gross Subtotal</span><span class="s-val">${formatPrice(breakdown.rawSubtotal)}</span></div>
                                ${breakdown.discountAmount > 0 ? `
                                <div class="s-row s-discount">
                                    <span>Discount ${breakdown.discount.type === "percent" ? `(${breakdown.discount.value}%)` : "(Flat)"}</span>
                                    <span>− ${formatPrice(breakdown.discountAmount)}</span>
                                </div>` : ""}
                                ${breakdown.miscCostAmount > 0 ? `
                                <div class="s-row"><span>Other / Delivery Charges</span><span class="s-val">+ ${formatPrice(breakdown.miscCostAmount)}</span></div>` : ""}
                                ${(breakdown.gstRate > 0 && (breakdown.discountAmount > 0 || breakdown.miscCostAmount > 0)) ? `
                                <div class="s-row"><span>Taxable Amount</span><span class="s-val">${formatPrice(breakdown.taxableAmount)}</span></div>` : ""}
                                ${(breakdown.gstRate > 0 && breakdown.gstAmount > 0) ? `
                                <div class="s-row">
                                    <span>GST (${breakdown.gstRate}%)</span>
                                    <span class="s-val">+ ${formatPrice(breakdown.gstAmount)}</span>
                                </div>` : ""}
                                <div class="s-rule"></div>
                                <div class="s-total">
                                    <span>Total Amount</span>
                                    <span>${formatPrice(breakdown.finalTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="doc-footer">
                        This is a computer-generated quote.
                    </div>
                </body>
                </html>
            `;

            const printIframe = document.createElement("iframe");
            printIframe.style.position = "fixed";
            printIframe.style.right = "0";
            printIframe.style.bottom = "0";
            printIframe.style.width = "0";
            printIframe.style.height = "0";
            printIframe.style.border = "0";
            printIframe.style.visibility = "hidden";
            document.body.appendChild(printIframe);

            const iframeDoc = printIframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(printContent);
            iframeDoc.close();

            const triggerPrint = () => {
                try {
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();
                } catch (printErr) {
                    console.error("Print execution failed:", printErr);
                } finally {
                    setTimeout(() => {
                        if (document.body.contains(printIframe)) {
                            document.body.removeChild(printIframe);
                        }
                    }, 2000);
                }
            };

            setTimeout(triggerPrint, 350);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate PDF quotation.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* ── Start New Board ── */}
            <div className={styles.newBoardSection}>
                <div className={styles.newBoardInfo}>
                    <span className={styles.newBoardTitle}>
                        {activeCartItem ? `Editing: ${activeCartItem.name}` : "Done with this board?"}
                    </span>
                    <span className={styles.newBoardSub}>
                        {activeCartItem
                            ? "Update your changes in cart below, or start a fresh board."
                            : "Add it to the cart first, then start a fresh one."}
                    </span>
                </div>
                <button
                    type="button"
                    className={styles.newBoardBtn}
                    onClick={() => {
                        if (!backplate) { resetBoard(); return; }
                        if (window.confirm("Start a new board? The current board will be cleared.\n\nMake sure you've updated or added it to the cart first.")) {
                            resetBoard();
                        }
                    }}
                >
                    <RotateCcw size={14} />
                    New Board
                </button>
            </div>

            {/* Export Actions Section */}
            <div className={styles.exportSection}>
                <h4 className={styles.sectionTitle}>Export Options</h4>

                <div className={styles.actionsGrid}>
                    {/* PNG Image Download */}
                    <button
                        type="button"
                        className={styles.actionCard}
                        onClick={handleDownloadPng}
                        disabled={!hasBackplate || isExportingPng}
                    >
                        <div className={styles.actionIconWrapper}>
                            {isExportingPng ? (
                                <Loader2 size={20} className={styles.spinner} />
                            ) : (
                                <Image size={20} />
                            )}
                        </div>
                        <div className={styles.actionDetails}>
                            <span className={styles.actionTitle}>Download PNG Image</span>
                            <span className={styles.actionSub}>High-resolution transparent graphic</span>
                        </div>
                        <Download size={16} className={styles.downloadArrow} />
                    </button>

                    {/* JPEG Image Download */}
                    <button
                        type="button"
                        className={styles.actionCard}
                        onClick={handleDownloadJpeg}
                        disabled={!hasBackplate || isExportingJpeg}
                    >
                        <div className={styles.actionIconWrapper}>
                            {isExportingJpeg ? (
                                <Loader2 size={20} className={styles.spinner} />
                            ) : (
                                <Image size={20} />
                            )}
                        </div>
                        <div className={styles.actionDetails}>
                            <span className={styles.actionTitle}>Download JPEG Image</span>
                            <span className={styles.actionSub}>Solid white backdrop</span>
                        </div>
                        <Download size={16} className={styles.downloadArrow} />
                    </button>

                    {/* PDF Document Export */}
                    <button
                        type="button"
                        className={styles.actionCard}
                        onClick={() => setIsBomModalOpen(true)}
                        disabled={!hasBackplate || isExportingPdf}
                    >
                        <div className={`${styles.actionIconWrapper} ${styles.pdfIconWrapper}`}>
                            {isExportingPdf ? (
                                <Loader2 size={20} className={styles.spinner} />
                            ) : (
                                <FileText size={20} />
                            )}
                        </div>
                        <div className={styles.actionDetails}>
                            <span className={styles.actionTitle}>Download PDF Quotation</span>
                            <span className={styles.actionSub}>Detailed Bill of Materials & pricing</span>
                        </div>
                        <Download size={16} className={styles.downloadArrow} />
                    </button>

                    {/* Hidden JSON input */}
                    <input
                        ref={jsonFileInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: "none" }}
                        onChange={handleLoadJson}
                    />

                    {/* JSON Configuration Download */}
                    <button
                        type="button"
                        className={styles.actionCard}
                        onClick={() => downloadConfiguration()}
                        disabled={!hasBackplate}
                    >
                        <div className={styles.actionIconWrapper}>
                            <FileJson size={20} />
                        </div>
                        <div className={styles.actionDetails}>
                            <span className={styles.actionTitle}>Download Config (JSON)</span>
                            <span className={styles.actionSub}>Save board design to reload anytime</span>
                        </div>
                        <Download size={16} className={styles.downloadArrow} />
                    </button>



                    {/* ── Cart Actions (Update / Add as New / Add to Cart) ── */}
                    {activeCartItem ? (
                        <>
                            {/* 1. Update existing board in cart */}
                            <button
                                type="button"
                                className={styles.actionCard}
                                onClick={handleUpdateCart}
                                disabled={!hasBackplate || isAddingToCart}
                            >
                                <div className={`${styles.actionIconWrapper} ${styles.cartIconWrapper}`}>
                                    {isAddingToCart ? (
                                        <Loader2 size={20} className={styles.spinner} />
                                    ) : cartNotice === "updated" ? (
                                        <Check size={20} />
                                    ) : (
                                        <RefreshCw size={20} />
                                    )}
                                </div>
                                <div className={styles.actionDetails}>
                                    <span className={styles.actionTitle}>
                                        {cartNotice === "updated" ? "Updated in Cart!" : `Update "${activeCartItem.name}" in Cart`}
                                    </span>
                                    <span className={styles.actionSub}>
                                        {cartNotice === "updated"
                                            ? "Your changes have been saved to this board in cart"
                                            : "Save your latest changes back to the cart entry"}
                                    </span>
                                </div>
                                {cartNotice !== "updated" && !isAddingToCart && (
                                    <Check size={16} className={styles.downloadArrow} />
                                )}
                            </button>

                            {/* 2. Save as new separate copy in cart */}
                            <button
                                type="button"
                                className={styles.actionCard}
                                onClick={handleSaveAsNewCart}
                                disabled={!hasBackplate || isAddingToCart}
                            >
                                <div className={styles.actionIconWrapper}>
                                    {isAddingToCart ? (
                                        <Loader2 size={20} className={styles.spinner} />
                                    ) : cartNotice === "added_new" ? (
                                        <Check size={20} />
                                    ) : (
                                        <Plus size={20} />
                                    )}
                                </div>
                                <div className={styles.actionDetails}>
                                    <span className={styles.actionTitle}>
                                        {cartNotice === "added_new" ? "Added Copy to Cart!" : "Save as New Board to Cart"}
                                    </span>
                                    <span className={styles.actionSub}>
                                        {`Keep "${activeCartItem.name}" and save this as a separate entry`}
                                    </span>
                                </div>
                                {cartNotice !== "added_new" && !isAddingToCart && (
                                    <ShoppingCart size={16} className={styles.downloadArrow} />
                                )}
                            </button>
                        </>
                    ) : (
                        /* Standard Add to Cart */
                        <button
                            type="button"
                            className={styles.actionCard}
                            onClick={handleAddToCart}
                            disabled={!hasBackplate || isAddingToCart}
                        >
                            <div className={`${styles.actionIconWrapper} ${styles.cartIconWrapper}`}>
                                {isAddingToCart ? (
                                    <Loader2 size={20} className={styles.spinner} />
                                ) : cartNotice === "added" ? (
                                    <Check size={20} />
                                ) : (
                                    <ShoppingCart size={20} />
                                )}
                            </div>
                            <div className={styles.actionDetails}>
                                <span className={styles.actionTitle}>
                                    {cartNotice === "added" ? "Added to Cart!" : "Add to Cart"}
                                </span>
                                <span className={styles.actionSub}>
                                    {cartNotice === "added"
                                        ? "Open the Cart tab in the right panel to view"
                                        : "Save this board to the multi-board quote cart"}
                                </span>
                            </div>
                            {cartNotice !== "added" && !isAddingToCart && (
                                <ShoppingCart size={16} className={styles.downloadArrow} />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <PdfBomModal
                isOpen={isBomModalOpen}
                onClose={() => setIsBomModalOpen(false)}
                onConfirm={handleDownloadPdf}
                title="Quotation Options"
                description="Choose whether to include the Bill of Materials (BOM) in your quotation."
            />
        </div>
    );
}
