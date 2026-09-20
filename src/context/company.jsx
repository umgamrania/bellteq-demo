import { createContext, useState } from "react";
import { COMPANY_INFO } from "../data/companyInfo";

export const companyContext = createContext(null);

const STORAGE_KEY_COMPANY = "myob_company_info_v1";

export default function CompanyProvider({ children }) {
    const [companyInfo, setCompanyInfoState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_COMPANY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === "object") {
                    return { ...COMPANY_INFO, ...parsed };
                }
            }
        } catch (e) {
            console.error("Failed to load company info from localStorage", e);
        }
        return COMPANY_INFO;
    });

    const updateCompanyInfo = (newInfo) => {
        setCompanyInfoState((prev) => {
            const updated = { ...prev, ...newInfo };
            try {
                localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to save company info to localStorage", e);
            }
            return updated;
        });
    };

    const resetCompanyInfo = () => {
        try {
            localStorage.removeItem(STORAGE_KEY_COMPANY);
        } catch (e) {
            console.error("Failed to clear company info from localStorage", e);
        }
        setCompanyInfoState(COMPANY_INFO);
    };

    return (
        <companyContext.Provider value={{ companyInfo, updateCompanyInfo, resetCompanyInfo }}>
            {children}
        </companyContext.Provider>
    );
}

