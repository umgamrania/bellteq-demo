import { useState, useContext } from "react";
import { toPng, toJpeg } from "html-to-image";
import {
    Download,
    Image,
    FileText,
    Check,
    Loader2
} from "lucide-react";
import { boardContext } from "../context/board";
import { pricingContext } from "../context/pricing";
import { COMPANY_INFO } from "../data/companyInfo";
import styles from "./ExportSelector.module.css";

export default function ExportSelector() {
    const { backplate, components, material } = useContext(boardContext);
    const { formatPrice, calculateBreakdown } = useContext(pricingContext);

    const [isExportingPng, setIsExportingPng] = useState(false);
    const [isExportingJpeg, setIsExportingJpeg] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const breakdown = calculateBreakdown(backplate, components, material);
    const hasBackplate = Boolean(backplate?.src);

    const showNotification = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

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
            showNotification("PNG image downloaded successfully!");
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
            showNotification("JPEG image downloaded successfully!");
        } catch (err) {
            console.error("Error generating JPEG image:", err);
            alert("Failed to export JPEG image. Please try again.");
        } finally {
            setIsExportingJpeg(false);
        }
    };

    // Print / PDF Quote Generation
    const handleDownloadPdf = async () => {
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
                        <td style="text-align: center; color: #6b7280;">${serialNo++}</td>
                        <td>
                            <strong>${breakdown.backplateItem.name}</strong>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                                Modular Backplate Mounting Unit • ${breakdown.backplateItem.slots} slots • ${breakdown.backplateItem.rows} row${breakdown.backplateItem.rows > 1 ? "s" : ""}
                            </div>
                        </td>
                        <td style="color: #4b5563; font-size: 12px;">Backplate</td>
                        <td style="text-align: center; font-weight: 600;">1</td>
                        <td style="text-align: right;">${formatPrice(breakdown.backplateItem.unitPrice)}</td>
                        <td style="text-align: right; font-weight: 600;">${formatPrice(breakdown.backplateItem.unitPrice)}</td>
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
                        <td style="text-align: center; color: #6b7280;">${serialNo++}</td>
                        <td>
                            <strong>${item.name}</strong>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                                ${specLabel}
                            </div>
                        </td>
                        <td style="color: #4b5563; font-size: 12px;">${catLabel}</td>
                        <td style="text-align: center; font-weight: 600;">${item.count}</td>
                        <td style="text-align: right;">${formatPrice(item.unitPrice)}</td>
                        <td style="text-align: right; font-weight: 600;">${formatPrice(item.totalPrice)}</td>
                    </tr>
                `;
            }

            // 3. Material Row
            if (breakdown.materialItem && breakdown.materialItem.unitPrice > 0) {
                rowsHtml += `
                    <tr>
                        <td style="text-align: center; color: #6b7280;">${serialNo++}</td>
                        <td>
                            <strong>${breakdown.materialItem.name} Finish</strong>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                                Custom Surface Finish Treatment
                            </div>
                        </td>
                        <td style="color: #4b5563; font-size: 12px;">Surface Finish</td>
                        <td style="text-align: center; font-weight: 600;">1</td>
                        <td style="text-align: right;">${formatPrice(breakdown.materialItem.unitPrice)}</td>
                        <td style="text-align: right; font-weight: 600;">${formatPrice(breakdown.materialItem.unitPrice)}</td>
                    </tr>
                `;
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

            // Assemble company contact details
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

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${companyName ? `${companyName} - Quotation` : "Board Quotation"}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
                        
                        @page {
                            size: A4 portrait;
                            margin: 10mm 12mm;
                        }

                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: #ffffff;
                            color: #1f2937;
                            padding: 20px 24px;
                            font-size: 12px;
                            line-height: 1.4;
                            max-width: 860px;
                            margin: 0 auto;
                        }

                        /* Header Bar */
                        .header-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 0;
                        }
                        .header-left {
                            vertical-align: top;
                            text-align: left;
                            width: 58%;
                        }
                        .brand-logo-img {
                            height: 46px;
                            width: auto;
                            max-width: 220px;
                            object-fit: contain;
                            filter: brightness(0);
                            margin-bottom: 4px;
                            display: block;
                        }
                        .company-subname {
                            font-size: 10.5px;
                            font-weight: 800;
                            letter-spacing: 0.08em;
                            color: #1e293b;
                            margin-bottom: 2px;
                            text-transform: uppercase;
                        }
                        .company-details {
                            font-size: 10px;
                            color: #64748b;
                            line-height: 1.45;
                        }
                        .company-details strong {
                            color: #334155;
                        }
                        .header-right {
                            vertical-align: top;
                            text-align: right;
                            width: 42%;
                        }
                        .doc-title {
                            font-size: 22px;
                            font-weight: 900;
                            color: #0f172a;
                            letter-spacing: 0.06em;
                            text-transform: uppercase;
                            line-height: 1.1;
                        }
                        .doc-subtitle {
                            font-size: 9px;
                            font-weight: 700;
                            letter-spacing: 0.1em;
                            color: #94a3b8;
                            text-transform: uppercase;
                            margin-top: 2px;
                            margin-bottom: 6px;
                        }
                        .meta-grid-table {
                            margin-left: auto;
                            border-collapse: collapse;
                            font-size: 11px;
                        }
                        .meta-grid-table td {
                            padding: 2px 0 2px 8px;
                        }
                        .meta-th {
                            text-align: right;
                            color: #64748b;
                            font-weight: 600;
                            font-size: 10px;
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                        }
                        .meta-td {
                            text-align: right;
                            color: #0f172a;
                        }
                        .header-divider {
                            height: 1.5px;
                            background: linear-gradient(90deg, #0f172a 0%, #cbd5e1 100%);
                            margin: 10px 0 14px 0;
                        }

                        /* Visual Preview Section */
                        .visual-section {
                            background: #fafafa;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            padding: 8px 12px;
                            margin-bottom: 12px;
                            text-align: center;
                        }
                        .visual-title {
                            font-size: 10px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            color: #6b7280;
                            text-align: left;
                            margin-bottom: 4px;
                        }
                        .visual-image {
                            max-height: 120px;
                            max-width: 100%;
                            object-fit: contain;
                            margin: 0 auto;
                            display: block;
                            filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08));
                        }

                        /* BOM Table */
                        .section-heading {
                            font-size: 12px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                            color: #111827;
                            margin-bottom: 6px;
                        }
                        .bom-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 10px;
                        }
                        .bom-table th {
                            background: #f3f4f6;
                            color: #374151;
                            font-size: 10.5px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                            padding: 6px 10px;
                            border-top: 1px solid #e5e7eb;
                            border-bottom: 1.5px solid #d1d5db;
                            text-align: left;
                        }
                        .bom-table td {
                            padding: 6px 10px;
                            border-bottom: 1px solid #e5e7eb;
                            font-size: 11px;
                            color: #1f2937;
                        }
                        .bom-table tr:nth-child(even) {
                            background: #fafafa;
                        }

                        /* Summary Box */
                        .summary-wrapper {
                            display: flex;
                            justify-content: flex-end;
                            margin-top: 6px;
                        }
                        .summary-card {
                            width: 290px;
                            background: #ffffff;
                            border: 1px solid #e5e7eb;
                            border-radius: 6px;
                            padding: 8px 12px;
                        }
                        .sum-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 11px;
                            margin-bottom: 4px;
                            color: #4b5563;
                        }
                        .sum-val {
                            font-weight: 600;
                            color: #111827;
                        }
                        .discount-row {
                            color: #16a34a;
                            font-weight: 600;
                        }
                        .divider {
                            height: 1px;
                            background: #e5e7eb;
                            margin: 5px 0;
                        }
                        .grand-total-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 13.5px;
                            font-weight: 800;
                            color: #111827;
                            padding-top: 2px;
                        }

                        @media print {
                            html, body {
                                padding: 0 !important;
                                margin: 0 !important;
                                max-width: 100% !important;
                            }
                            .visual-section {
                                break-inside: avoid;
                            }
                            .summary-wrapper {
                                break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <!-- Professional Quotation / Bill Header -->
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
                                    <tr>
                                        <td class="meta-th">Date:</td>
                                        <td class="meta-td">${dateString}</td>
                                    </tr>
                                    <tr>
                                        <td class="meta-th">Validity:</td>
                                        <td class="meta-td">${docValidity}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <div class="header-divider"></div>

                    <!-- Switchboard Visual Design Preview -->
                    ${boardImageDataUrl ? `
                        <div class="visual-section">
                            <div class="visual-title">Board Preview</div>
                            <img class="visual-image" src="${boardImageDataUrl}" alt="Board Preview" />
                        </div>
                    ` : ""}

                    <!-- Itemized Bill of Materials (BOM) -->
                    <div class="section-heading">Bill of Materials (BOM)</div>
                    <table class="bom-table">
                        <thead>
                            <tr>
                                <th style="width: 6%; text-align: center;">#</th>
                                <th style="width: 44%;">Item Description</th>
                                <th style="width: 18%;">Category</th>
                                <th style="width: 8%; text-align: center;">Qty</th>
                                <th style="width: 12%; text-align: right;">Unit Rate</th>
                                <th style="width: 12%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <!-- Financial Summary -->
                    <div class="summary-wrapper">
                        <div class="summary-card">
                            <div class="sum-row">
                                <span>Gross Subtotal:</span>
                                <span class="sum-val">${formatPrice(breakdown.rawSubtotal)}</span>
                            </div>
                            ${breakdown.discountAmount > 0 ? `
                                <div class="sum-row discount-row">
                                    <span>Discount ${breakdown.discount.type === "percent" ? `(${breakdown.discount.value}%)` : "(Flat)"}:</span>
                                    <span>-${formatPrice(breakdown.discountAmount)}</span>
                                </div>
                                <div class="sum-row">
                                    <span>Taxable Subtotal:</span>
                                    <span class="sum-val">${formatPrice(breakdown.taxableAmount)}</span>
                                </div>
                            ` : ""}
                            <div class="sum-row">
                                <span>GST (${breakdown.gstRate}%):</span>
                                <span class="sum-val">${breakdown.gstAmount > 0 ? `+${formatPrice(breakdown.gstAmount)}` : "₹0.00 (0%)"}</span>
                            </div>
                            ${breakdown.miscCostAmount > 0 ? `
                                <div class="sum-row">
                                    <span>Other / Delivery Charges:</span>
                                    <span class="sum-val">+${formatPrice(breakdown.miscCostAmount)}</span>
                                </div>
                            ` : ""}
                            <div class="divider"></div>
                            <div class="grand-total-row">
                                <span>Total Amount:</span>
                                <span>${formatPrice(breakdown.finalTotal)}</span>
                            </div>
                        </div>
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
            showNotification("Quotation generated!");
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate PDF quotation.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Notification Toast */}
            {successMessage && (
                <div className={styles.toast}>
                    <Check size={14} />
                    <span>{successMessage}</span>
                </div>
            )}

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
                        onClick={handleDownloadPdf}
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
                </div>
            </div>
        </div>
    );
}
