import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { X, Building2, RotateCcw, Check } from "lucide-react";
import { companyContext } from "../../context/company";
import styles from "./CompanyDetailsModal.module.css";

export default function CompanyDetailsModal({ isOpen, onClose }) {
    const { companyInfo, updateCompanyInfo, resetCompanyInfo } = useContext(companyContext) || {};

    const [form, setForm] = useState(() => companyInfo || {});
    const [savedNotice, setSavedNotice] = useState(false);

    // Sync form state when modal opens or companyInfo changes
    useEffect(() => {
        if (isOpen && companyInfo) {
            setForm({ ...companyInfo });
        }
    }, [isOpen, companyInfo]);

    // Handle Escape key
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

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (updateCompanyInfo) {
            updateCompanyInfo(form);
        }
        setSavedNotice(true);
        setTimeout(() => {
            setSavedNotice(false);
            onClose();
        }, 500);
    };

    const handleReset = () => {
        if (window.confirm("Reset company details to factory defaults?")) {
            if (resetCompanyInfo) resetCompanyInfo();
            onClose();
        }
    };

    const modalContent = (
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
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3 className={styles.titleText}>Edit Company Details</h3>
                            <p className={styles.subtitleText}>
                                These details appear on your downloaded PDF quotations and invoices.
                            </p>
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

                {/* Form Body */}
                <form id="company-details-form" onSubmit={handleSave} className={styles.formBody}>
                    {/* Brand & Identity */}
                    <div className={styles.sectionHeader}>
                        <span>Company Branding</span>
                    </div>

                    <div className={styles.gridRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Company Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.name || ""}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="e.g. BELLATEQ SMART LIVING"
                                required
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tagline</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.tagline || ""}
                                onChange={(e) => handleChange("tagline", e.target.value)}
                                placeholder="e.g. Custom Modular Switchboards"
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className={styles.sectionHeader}>
                        <span>Contact & Legal Information</span>
                    </div>

                    <div className={styles.gridRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>GSTIN / Tax ID</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.gstin || ""}
                                onChange={(e) => handleChange("gstin", e.target.value)}
                                placeholder="e.g. 27AAAAA0000A1Z5"
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.phone || ""}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="e.g. +91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className={styles.gridRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email Address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={form.email || ""}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="e.g. support@company.com"
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Website</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.website || ""}
                                onChange={(e) => handleChange("website", e.target.value)}
                                placeholder="e.g. www.company.com"
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Address</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={form.address || ""}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="e.g. 101, Business Park, Rajkot"
                        />
                    </div>

                    {/* Document Quotation Settings */}
                    <div className={styles.sectionHeader}>
                        <span>Quotation Document Defaults</span>
                    </div>

                    <div className={styles.gridRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Quotation Title</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.quotationTitle || ""}
                                onChange={(e) => handleChange("quotationTitle", e.target.value)}
                                placeholder="e.g. QUOTATION"
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Default Validity</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.validity || ""}
                                onChange={(e) => handleChange("validity", e.target.value)}
                                placeholder="e.g. 30 Days"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.resetBtn}
                        onClick={handleReset}
                        title="Reset to original company defaults"
                    >
                        <RotateCcw size={13} />
                        Reset Defaults
                    </button>
                    <div className={styles.footerActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="company-details-form"
                            className={styles.saveBtn}
                        >
                            {savedNotice ? (
                                <>
                                    <Check size={14} /> Saved!
                                </>
                            ) : (
                                "Save Details"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

