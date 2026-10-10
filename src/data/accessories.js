// Accessory catalogue — items that can be purchased alongside a board
// but are not physically placed on it.
export const ACCESSORIES = [
    {
        id: "wifi-chip",
        name: "WiFi Chip",
        description: "Wi-Fi automation module for smart control",
        type: "quantity", // 0, 1, 2 …
    },
    {
        id: "hi-load",
        name: "Hi Load",
        description: "High-load capacity relay cell",
        type: "quantity", // 0, 1, 2 …
    },
];

// Flat lookup by ID
export const ACCESSORY_MAP = Object.fromEntries(
    ACCESSORIES.map((a) => [a.id, a])
);

