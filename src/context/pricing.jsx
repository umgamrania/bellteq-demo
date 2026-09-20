import { createContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_PRICES, STORAGE_KEY_PRICES, DEFAULT_CURRENCY } from "../data/defaultPricing";

export const pricingContext = createContext(null);

const STORAGE_KEY_GST = "myob_gst_rate_v1";
const STORAGE_KEY_DISCOUNT = "myob_discount_config_v1";
const STORAGE_KEY_MISC_COST = "myob_misc_cost_v1";

export default function PricingProvider({ children }) {
    // Initialize prices from localStorage with fallback to default catalog
    const [prices, setPrices] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_PRICES);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_PRICES, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load prices from localStorage", e);
        }
        return { ...DEFAULT_PRICES };
    });

    const currency = DEFAULT_CURRENCY;

    // GST state (e.g. 0, 5, 9, 12, 18, 28, or custom)
    const [gstRate, setGstRateState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_GST);
            if (saved !== null) {
                const num = Number(saved);
                if (!isNaN(num) && num >= 0) return num;
            }
        } catch (e) {
            console.error("Failed to load GST from localStorage", e);
        }
        return 18; // Default 18% GST standard in India
    });

    // Discount state: { type: "percent" | "flat", value: number }
    const [discount, setDiscountState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_DISCOUNT);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed.value === "number") return parsed;
            }
        } catch (e) {
            console.error("Failed to load discount from localStorage", e);
        }
        return { type: "percent", value: 0 };
    });

    // Misc cost state: a flat ₹ amount added after GST (e.g. delivery, installation)
    const [miscCost, setMiscCostState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_MISC_COST);
            if (saved !== null) {
                const num = Number(saved);
                if (!isNaN(num) && num >= 0) return num;
            }
        } catch (e) {
            console.error("Failed to load misc cost from localStorage", e);
        }
        return 0;
    });

    // Modal state for price configuration
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    // Responsive sidebar toggle: open by default on desktop (>= 1024px), closed on mobile
    const [isPricingSidebarOpen, setIsPricingSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024;
        }
        return false;
    });

    // Persist prices to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(prices));
        } catch (e) {
            console.error("Failed to save prices to localStorage", e);
        }
    }, [prices]);

    // Persist GST
    const setGstRate = useCallback((rate) => {
        const num = Number(rate);
        const val = isNaN(num) || num < 0 ? 0 : num;
        setGstRateState(val);
        try {
            localStorage.setItem(STORAGE_KEY_GST, val.toString());
        } catch (e) {
            console.error("Failed to save GST to localStorage", e);
        }
    }, []);

    // Persist Discount
    const setDiscount = useCallback((discountConfig) => {
        setDiscountState(discountConfig);
        try {
            localStorage.setItem(STORAGE_KEY_DISCOUNT, JSON.stringify(discountConfig));
        } catch (e) {
            console.error("Failed to save discount to localStorage", e);
        }
    }, []);

    // Persist Misc Cost
    const setMiscCost = useCallback((value) => {
        const num = Number(value);
        const val = isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100;
        setMiscCostState(val);
        try {
            localStorage.setItem(STORAGE_KEY_MISC_COST, val.toString());
        } catch (e) {
            console.error("Failed to save misc cost to localStorage", e);
        }
    }, []);

    // Helper price getters
    const getBackplatePrice = useCallback((id) => {
        if (!id) return 0;
        const key = `backplate_${id}`;
        const val = prices[key];
        return typeof val === "number" && !isNaN(val) ? val : (DEFAULT_PRICES[key] ?? 0);
    }, [prices]);

    const getComponentPrice = useCallback((id) => {
        if (!id) return 0;
        const key = `component_${id}`;
        const val = prices[key];
        return typeof val === "number" && !isNaN(val) ? val : (DEFAULT_PRICES[key] ?? 0);
    }, [prices]);

    const getMaterialPrice = useCallback((id) => {
        if (!id) return 0;
        const key = `material_${id}`;
        const val = prices[key];
        return typeof val === "number" && !isNaN(val) ? val : (DEFAULT_PRICES[key] ?? 0);
    }, [prices]);

    const getAccessoryPrice = useCallback((id) => {
        if (!id) return 0;
        const key = `accessory_${id}`;
        const val = prices[key];
        return typeof val === "number" && !isNaN(val) ? val : (DEFAULT_PRICES[key] ?? 0);
    }, [prices]);

    // Format number to currency display (INR ₹)
    const formatPrice = useCallback((amount) => {
        const num = Number(amount) || 0;
        return `${currency}${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [currency]);

    // Update single item price
    const updatePrice = useCallback((key, newPrice) => {
        const parsed = Number(newPrice);
        const validPrice = isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 100) / 100;
        setPrices(prev => ({
            ...prev,
            [key]: validPrice,
        }));
    }, []);

    // Batch update prices
    const updateAllPrices = useCallback((newPrices) => {
        setPrices(prev => ({
            ...prev,
            ...newPrices,
        }));
    }, []);

    // Reset prices to defaults
    const resetPrices = useCallback(() => {
        setPrices({ ...DEFAULT_PRICES });
        try {
            localStorage.removeItem(STORAGE_KEY_PRICES);
        } catch (e) {
            console.error("Failed to clear prices from localStorage", e);
        }
    }, []);

    // Calculate full Bill of Materials (BOM) & breakdown with Discount and GST
    const calculateBreakdown = useCallback((backplate, componentsMap, material, accessoriesMap) => {
        // 1. Backplate
        let backplateItem = null;
        let backplateCost = 0;
        if (backplate && backplate.id) {
            backplateCost = getBackplatePrice(backplate.id);
            backplateItem = {
                id: backplate.id,
                name: backplate.name || `Backplate ${backplate.id}`,
                slots: backplate.slots,
                rows: backplate.rows,
                src: backplate.src,
                unitPrice: backplateCost,
                totalPrice: backplateCost,
            };
        }

        // 2. Components (group identical component definitions together)
        const compCounts = {};
        const compInstances = Object.values(componentsMap || {});
        let totalSlotsOccupied = 0;

        for (const comp of compInstances) {
            if (!comp || !comp.id) continue;
            totalSlotsOccupied += (comp.slots || 0);

            if (!compCounts[comp.id]) {
                const unitPrice = getComponentPrice(comp.id);
                compCounts[comp.id] = {
                    id: comp.id,
                    name: comp.name,
                    category: comp.category,
                    slots: comp.slots,
                    src: comp.src,
                    unitPrice,
                    count: 0,
                    totalPrice: 0,
                    instanceIds: [],
                };
            }

            compCounts[comp.id].count += 1;
            compCounts[comp.id].instanceIds.push(comp.instance_id);
            compCounts[comp.id].totalPrice = compCounts[comp.id].count * compCounts[comp.id].unitPrice;
        }

        const componentItems = Object.values(compCounts).sort((a, b) => {
            const catOrder = { switches: 1, plugs: 2, other: 3 };
            const orderA = catOrder[a.category] || 4;
            const orderB = catOrder[b.category] || 4;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
        });

        const componentsSubtotal = componentItems.reduce((sum, item) => sum + item.totalPrice, 0);

        // 3. Material
        let materialItem = null;
        let materialCost = 0;
        if (material && material.id) {
            materialCost = getMaterialPrice(material.id);
            materialItem = {
                id: material.id,
                name: material.name,
                src: material.src,
                unitPrice: materialCost,
                totalPrice: materialCost,
            };
        }

        // 4. Accessories
        const accessoryItems = [];
        let accessoriesCost = 0;
        if (accessoriesMap && typeof accessoriesMap === "object") {
            for (const [id, value] of Object.entries(accessoriesMap)) {
                // wifi-chip is boolean; hi-load is a number qty
                const qty = typeof value === "boolean" ? (value ? 1 : 0) : Math.max(0, Math.round(Number(value) || 0));
                if (qty === 0) continue;
                const unitPrice = getAccessoryPrice(id);
                const totalPrice = unitPrice * qty;
                accessoriesCost += totalPrice;
                accessoryItems.push({ id, qty, unitPrice, totalPrice });
            }
        }

        // Subtotal before discounts
        const rawSubtotal = backplateCost + componentsSubtotal + materialCost + accessoriesCost;

        // Discount calculation
        let discountAmount = 0;
        if (discount.value > 0 && rawSubtotal > 0) {
            if (discount.type === "percent") {
                discountAmount = (rawSubtotal * Math.min(100, Math.max(0, discount.value))) / 100;
            } else {
                discountAmount = Math.min(rawSubtotal, Math.max(0, discount.value));
            }
        }
        discountAmount = Math.round(discountAmount * 100) / 100;

        // Misc Cost (e.g. delivery, installation, other charges)
        const miscCostAmount = Math.max(0, Math.round(miscCost * 100) / 100);

        // Taxable Subtotal: GST is applied AFTER, ON TOP OF misc charges and discounts
        const taxableAmount = Math.max(0, rawSubtotal - discountAmount + miscCostAmount);

        // GST calculation
        let gstAmount = 0;
        if (gstRate > 0 && taxableAmount > 0) {
            gstAmount = (taxableAmount * gstRate) / 100;
        }
        gstAmount = Math.round(gstAmount * 100) / 100;

        // Final Total
        const finalTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

        return {
            backplateItem,
            componentItems,
            materialItem,
            accessoryItems,
            totalComponentCount: compInstances.length,
            totalSlotsOccupied,
            backplateCost,
            componentsSubtotal,
            materialCost,
            accessoriesCost,
            rawSubtotal,
            discountAmount,
            discount,
            taxableAmount,
            gstRate,
            gstAmount,
            miscCostAmount,
            finalTotal,
        };
    }, [getBackplatePrice, getComponentPrice, getMaterialPrice, getAccessoryPrice, discount, gstRate, miscCost]);

    return (
        <pricingContext.Provider
            value={{
                prices,
                currency,
                gstRate,
                setGstRate,
                discount,
                setDiscount,
                miscCost,
                setMiscCost,
                isPricingModalOpen,
                setIsPricingModalOpen,
                isPricingSidebarOpen,
                setIsPricingSidebarOpen,
                getBackplatePrice,
                getComponentPrice,
                getMaterialPrice,
                getAccessoryPrice,
                formatPrice,
                updatePrice,
                updateAllPrices,
                resetPrices,
                calculateBreakdown,
            }}
        >
            {children}
        </pricingContext.Provider>
    );
}
