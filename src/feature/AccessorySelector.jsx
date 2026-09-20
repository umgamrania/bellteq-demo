import { useContext } from "react";
import { Wifi, Zap, Plus, Minus, Check } from "lucide-react";
import { boardContext } from "../context/board";
import { pricingContext } from "../context/pricing";
import { ACCESSORIES } from "../data/accessories";
import styles from "./AccessorySelector.module.css";

const ACCESSORY_ICONS = {
    "wifi-chip": Wifi,
    "hi-load": Zap,
};

export default function AccessorySelector() {
    const { accessories, setAccessoryQty } = useContext(boardContext);
    const { getAccessoryPrice, formatPrice } = useContext(pricingContext) || {};

    return (
        <div className={styles.container}>
            <p className={styles.hint}>
                These items are purchased with the board but are not placed on it.
            </p>

            <div className={styles.list}>
                {ACCESSORIES.map((accessory) => {
                    const Icon = ACCESSORY_ICONS[accessory.id] || Zap;
                    const price = getAccessoryPrice ? getAccessoryPrice(accessory.id) : 0;
                    const currentValue = accessories?.[accessory.id] ?? (accessory.type === "toggle" ? false : 0);
                    const isEnabled = accessory.type === "toggle" ? Boolean(currentValue) : Number(currentValue) > 0;

                    return (
                        <div
                            key={accessory.id}
                            className={`${styles.card} ${isEnabled ? styles.cardActive : ""}`}
                        >
                            <div className={styles.cardLeft}>
                                <div className={`${styles.iconWrapper} ${isEnabled ? styles.iconWrapperActive : ""}`}>
                                    <Icon size={18} />
                                </div>
                                <div className={styles.info}>
                                    <span className={styles.name}>{accessory.name}</span>
                                    <span className={styles.description}>{accessory.description}</span>
                                    {formatPrice && (
                                        <span className={styles.price}>{formatPrice(price)} each</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardRight}>
                                {accessory.type === "toggle" ? (
                                    /* Toggle button */
                                    <button
                                        type="button"
                                        className={`${styles.toggleBtn} ${isEnabled ? styles.toggleBtnOn : ""}`}
                                        onClick={() => setAccessoryQty(accessory.id, !currentValue)}
                                        aria-label={isEnabled ? `Remove ${accessory.name}` : `Add ${accessory.name}`}
                                    >
                                        {isEnabled ? (
                                            <>
                                                <Check size={14} />
                                                <span>Added</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={14} />
                                                <span>Add</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    /* Quantity stepper */
                                    <div className={styles.stepper}>
                                        <button
                                            type="button"
                                            className={styles.stepBtn}
                                            onClick={() => setAccessoryQty(accessory.id, Number(currentValue) - 1)}
                                            disabled={Number(currentValue) <= 0}
                                            aria-label={`Decrease ${accessory.name} quantity`}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className={`${styles.qty} ${Number(currentValue) > 0 ? styles.qtyActive : ""}`}>
                                            {currentValue}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.stepBtn}
                                            onClick={() => setAccessoryQty(accessory.id, Number(currentValue) + 1)}
                                            aria-label={`Increase ${accessory.name} quantity`}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {accessories && (accessories["wifi-chip"] || Number(accessories["hi-load"]) > 0) && (
                <div className={styles.summary}>
                    <span className={styles.summaryLabel}>Accessories total</span>
                    <span className={styles.summaryValue}>
                        {formatPrice
                            ? formatPrice(
                                (accessories["wifi-chip"] ? (getAccessoryPrice?.("wifi-chip") ?? 0) : 0) +
                                (Number(accessories["hi-load"]) * (getAccessoryPrice?.("hi-load") ?? 0))
              )
                            : "—"}
                    </span>
                </div>
            )}
        </div>
    );
}

