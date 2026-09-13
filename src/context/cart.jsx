import { createContext, useState, useCallback, useEffect } from "react";

export const cartContext = createContext(null);

const STORAGE_KEY_CART = "myob_cart_v1";

export default function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_CART);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error("Failed to load cart from localStorage", e);
        }
        return [];
    });

    // In-memory only: resets to null on page refresh
    const [activeCartId, setActiveCartId] = useState(null);

    // Clean up any old sessionStorage keys from prior sessions
    useEffect(() => {
        try {
            sessionStorage.removeItem("myob_active_cart_id");
        } catch {}
    }, []);

    // Persist cart to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
        } catch (e) {
            console.error("Failed to save cart to localStorage", e);
        }
    }, [cartItems]);

    /**
     * Add a new board snapshot to the cart.
     * @param {object} config  - Full output of exportConfiguration()
     * @param {string} [name]  - Display name (defaults to "Board N")
     * @param {string} [thumbnail] - Base64 PNG data URL of the board preview
     * @returns {string} cartId of the newly added item
     */
    const addToCart = useCallback((config, name, thumbnail) => {
        const cartId =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).substring(2, 9);

        setCartItems((prev) => {
            const defaultName = name || `Board ${prev.length + 1}`;
            const newItem = {
                cartId,
                name: defaultName,
                config,
                thumbnail: thumbnail || null,
                addedAt: new Date().toISOString(),
            };
            return [...prev, newItem];
        });

        setActiveCartId(cartId);
        return cartId;
    }, [setActiveCartId]);

    /**
     * Update an existing cart item's config/thumbnail (e.g. re-saving after edits).
     */
    const updateCartItem = useCallback((cartId, config, thumbnail) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartId === cartId
                    ? {
                          ...item,
                          config,
                          thumbnail: thumbnail !== undefined ? thumbnail : item.thumbnail,
                          updatedAt: new Date().toISOString(),
                      }
                    : item
            )
        );
    }, []);

    /** Rename a cart entry */
    const updateCartItemName = useCallback((cartId, name) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartId === cartId ? { ...item, name } : item
            )
        );
    }, []);

    /** Remove a single entry from the cart */
    const removeFromCart = useCallback((cartId) => {
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
        setActiveCartId((prev) => (prev === cartId ? null : prev));
    }, []);

    /** Clear all items (with confirmation) */
    const clearCart = useCallback(() => {
        if (window.confirm("Remove all boards from the cart?")) {
            setCartItems([]);
            setActiveCartId(null);
        }
    }, [setActiveCartId]);

    const cartCount = cartItems.length;

    return (
        <cartContext.Provider
            value={{
                cartItems,
                cartCount,
                activeCartId,
                setActiveCartId,
                addToCart,
                updateCartItem,
                updateCartItemName,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </cartContext.Provider>
    );
}
