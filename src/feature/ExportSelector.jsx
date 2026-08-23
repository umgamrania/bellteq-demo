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

    // Print / PDF Quote Generation with board image and enhanced details
    const handleDownloadPdf = async () => {
        setIsExportingPdf(true);
        try {
            const node = document.getElementById("switchboard-board-container");
            let boardImageDataUrl = "";
            if (node) {
                try {
                    boardImageDataUrl = await toPng(node, {
                        pixelRatio: 2,
                        cacheBust: true,
                    });
                } catch (e) {
                    console.error("Failed to capture board image for PDF", e);
                }
            }

            // Open print dialog with formatted quotation
            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                alert("Please allow popups to generate the printable PDF quotation.");
                setIsExportingPdf(false);
                return;
            }

            let componentsHtml = "";
            for (const item of breakdown.componentItems) {
                componentsHtml += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name} (${item.slots * item.count} slot${item.slots * item.count > 1 ? "s" : ""})</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.count}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.unitPrice)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatPrice(item.totalPrice)}</td>
                    </tr>
                `;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Switchboard Quotation</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111827; max-width: 800px; margin: 0 auto; }
                        h1 { font-size: 24px; margin-bottom: 4px; }
                        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
                        .preview-container { text-align: center; margin: 16px 0 28px; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; }
                        .preview-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; text-align: left; margin-bottom: 12px; }
                        .preview-img { max-height: 220px; max-width: 100%; object-fit: contain; margin: 0 auto; display: block; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.08)); }
                        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; margin-top: 24px; margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                        th { background: #f9fafb; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
                        .summary-box { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; float: right; width: 280px; }
                        .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
                        .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; border-top: 2px solid #111827; padding-top: 8px; margin-top: 8px; }
                        .footer-note { clear: both; padding-top: 40px; font-size: 11px; color: #9ca3af; text-align: center; }
                        @media print { 
                            body { padding: 20px; } 
                            .preview-container { break-inside: avoid; }
                            .summary-box { break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Switchboard Design Specification & Quotation</h1>
                    <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>

                    ${boardImageDataUrl ? `
                        <div class="preview-container">
                            <div class="preview-title">Visual Switchboard Design</div>
                            <img class="preview-img" src="${boardImageDataUrl}" alt="Switchboard Design" />
                        </div>
                    ` : ""}

                    <div class="section-title">Bill of Materials (BOM)</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Unit Rate</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${breakdown.backplateItem ? `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                        <strong>${breakdown.backplateItem.name}</strong> (${breakdown.backplateItem.slots} slots • ${breakdown.backplateItem.rows} row${breakdown.backplateItem.rows > 1 ? "s" : ""})
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">1</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(breakdown.backplateItem.unitPrice)}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatPrice(breakdown.backplateItem.unitPrice)}</td>
                                </tr>
                            ` : ""}
                            ${componentsHtml}
                            ${breakdown.materialItem && breakdown.materialItem.unitPrice > 0 ? `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Material: ${breakdown.materialItem.name}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">1</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(breakdown.materialItem.unitPrice)}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatPrice(breakdown.materialItem.unitPrice)}</td>
                                </tr>
                            ` : ""}
                        </tbody>
                    </table>

                    <div class="summary-box">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>${formatPrice(breakdown.rawSubtotal)}</span>
                        </div>
                        ${breakdown.discountAmount > 0 ? `
                            <div class="summary-row" style="color: #16a34a;">
                                <span>Discount (${breakdown.discount.type === "percent" ? `${breakdown.discount.value}%` : "Flat"}):</span>
                                <span>-${formatPrice(breakdown.discountAmount)}</span>
                            </div>
                        ` : ""}
                        <div class="summary-row">
                            <span>GST (${breakdown.gstRate}%):</span>
                            <span>+${formatPrice(breakdown.gstAmount)}</span>
                        </div>
                        <div class="total-row">
                            <span>Total Price:</span>
                            <span>${formatPrice(breakdown.finalTotal)}</span>
                        </div>
                    </div>

                    <div class="footer-note">Thank you for designing with Make Your Own Board. All prices are in INR (₹).</div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
            showNotification("PDF Quotation generated!");
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
