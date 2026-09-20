import { useEffect } from "react";
import { FileText, FileSpreadsheet, X, EyeOff } from "lucide-react";
import styles from "./PdfBomModal.module.css";

export default function PdfBomModal({
    isOpen,
    onClose,
    onConfirm,
    title = "PDF Quotation Options",
    description = "Choose whether to include the detailed Bill of Materials (BOM) in the quotation.",
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <div className={styles.iconCircle}>
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className={styles.titleText}>{title}</h3>
                            <p className={styles.subtitleText}>{description}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Choices */}
                <div className={styles.body}>
                    <button
                        type="button"
                        className={styles.choiceCard}
                        onClick={() => {
                            onConfirm(true);
                            onClose();
                        }}
                    >
                        <div className={`${styles.cardIcon} ${styles.iconBom}`}>
                            <FileSpreadsheet size={20} />
                        </div>
                        <div className={styles.cardInfo}>
                            <div className={styles.cardHeading}>
                                <span className={styles.cardTitle}>Include Bill of Materials (BOM)</span>
                                <span className={styles.badgePrimary}>Full Quote</span>
                            </div>
                            <span className={styles.cardDesc}>
                                Complete parts list with all switches, sockets, accessories, finishes, quantities, and itemized unit rates.
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className={styles.choiceCard}
                        onClick={() => {
                            onConfirm(false);
                            onClose();
                        }}
                    >
                        <div className={`${styles.cardIcon} ${styles.iconNoBom}`}>
                            <EyeOff size={20} />
                        </div>
                        <div className={styles.cardInfo}>
                            <div className={styles.cardHeading}>
                                <span className={styles.cardTitle}>Exclude Bill of Materials (BOM)</span>
                                <span className={styles.badgeSecondary}>Summary Only</span>
                            </div>
                            <span className={styles.cardDesc}>
                                Board design preview and total pricing summary only. Component rates and itemized parts list are hidden.
                            </span>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

