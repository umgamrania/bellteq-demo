// Default base prices for all backplates, components, and materials
export const STORAGE_KEY_PRICES = "myob_pricing_config_v1";
export const DEFAULT_CURRENCY = "₹";

export const DEFAULT_PRICES = {
    // Backplates (Keyed as `backplate_${id}`)
    "backplate_1": 250,   // 2 slots, 1 row
    "backplate_2": 300,   // 3 slots, 1 row
    "backplate_3": 350,   // 4 slots, 1 row
    "backplate_4": 450,   // 6 slots, 1 row
    "backplate_5": 600,   // 8 slots, 2 rows
    "backplate_6": 600,   // 8 slots, 1 row
    "backplate_7": 800,   // 12 slots, 2 rows
    "backplate_8": 1000,  // 16 slots, 2 rows
    "backplate_9": 1200,  // 18 slots, 3 rows

    // Switches
    "component_ssw-1x2": 350,
    "component_ssw-2": 300,
    "component_ssw-2f": 500,
    "component_ssw-2x2": 450,
    "component_ssw-4": 600,
    "component_ssw-4f": 750,
    "component_ssw-6": 900,

    // Plugs
    "component_plug-6a": 150,
    "component_plug-6a-2pin": 120,
    "component_plug-13a": 200,
    "component_plug-16a": 250,

    // Other Sockets
    "component_usb-1a-white": 180,
    "component_usb-1a-black": 180,
    "component_usb-2a-white": 220,
    "component_usb-2a-black": 220,
    "component_hdmi-white": 250,
    "component_hdmi-black": 250,
    "component_rj11-white": 150,
    "component_rj11-black": 150,
    "component_tv-white": 160,
    "component_tv-black": 160,
    "component_info-6a-white": 200,
    "component_info-6a-black": 200,
    "component_blanking-plate": 50,

    // Materials / Finishes (optional additional finish charge)
    "material_black": 0,
    "material_matte-black": 100,
    "material_white": 0,
    "material_own-material": 250,
    "material_own-background": 150,
};
