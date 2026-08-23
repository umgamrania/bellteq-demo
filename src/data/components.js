// Centralized component catalogue definitions with categorization
export const COMPONENT_SECTIONS = [
    {
        id: "switches",
        title: "Switches",
        items: [
            { id: "ssw-1x2", name: "SSW 1x2", src: "/components/Ssw1x2.png", category: "switches", slots: 2, icons: 3 },
            { id: "ssw-2", name: "SSW 2", src: "/components/Ssw2.png", category: "switches", slots: 2, icons: 2 },
            { id: "ssw-2f", name: "SSW 2F", src: "/components/Ssw2F.png", category: "switches", slots: 4, icons: 3 },
            { id: "ssw-2x2", name: "SSW 2x2", src: "/components/Ssw2x2.png", category: "switches", slots: 2, icons: 4 },
            { id: "ssw-4", name: "SSW 4", src: "/components/Ssw4.png", category: "switches", slots: 4, icons: 4 },
            { id: "ssw-4f", name: "SSW 4F", src: "/components/Ssw4F.png", category: "switches", slots: 6, icons: 5 },
            { id: "ssw-6", name: "SSW 6", src: "/components/Ssw6.png", category: "switches", slots: 6, icons: 6 },
        ],
    },
    {
        id: "plugs",
        title: "Plugs",
        items: [
            { id: "plug-6a", name: "6A Plug", src: "/components/6A Plug.png", category: "plugs", slots: 2 },
            { id: "plug-6a-2pin", name: "6A 2-Pin Plug", src: "/components/6A 2pin Plug.png", category: "plugs", slots: 1 },
            { id: "plug-13a", name: "13A Plug", src: "/components/13A Plug.png", category: "plugs", slots: 2 },
            { id: "plug-16a", name: "16A Plug", src: "/components/16A Plug.png", category: "plugs", slots: 2 },
        ],
    },
    {
        id: "other",
        title: "Other (USB & Sockets)",
        items: [
            { id: "usb-1a-white", name: "1A USB (White)", src: "/components/1A USB White.png", category: "other", slots: 1 },
            { id: "usb-1a-black", name: "1A USB (Black)", src: "/components/1A USB Black.png", category: "other", slots: 1 },
            { id: "usb-2a-white", name: "2A USB (White)", src: "/components/2A USB White.png", category: "other", slots: 1 },
            { id: "usb-2a-black", name: "2A USB (Black)", src: "/components/2A USB Black.png", category: "other", slots: 1 },
            { id: "hdmi-white", name: "HDMI (White)", src: "/components/HDMI White.png", category: "other", slots: 1 },
            { id: "hdmi-black", name: "HDMI (Black)", src: "/components/HDMI Black.png", category: "other", slots: 1 },
            { id: "rj11-white", name: "RJ-11 (White)", src: "/components/RJ-11 White.png", category: "other", slots: 1 },
            { id: "rj11-black", name: "RJ-11 (Black)", src: "/components/RJ-11 Black.png", category: "other", slots: 1 },
            { id: "tv-white", name: "TV Socket (White)", src: "/components/TV Socket White.png", category: "other", slots: 1 },
            { id: "tv-black", name: "TV Socket (Black)", src: "/components/TV Socket Black.png", category: "other", slots: 1 },
            { id: "info-6a-white", name: "Info Socket 6A (White)", src: "/components/Info Socket 6A White.png", category: "other", slots: 1 },
            { id: "info-6a-black", name: "Info Socket 6A (Black)", src: "/components/Info Socket 6A Black.png", category: "other", slots: 1 },
            { id: "blanking-plate", name: "Blanking Plate", src: "/components/Blanking Plate.png", category: "other", slots: 1 },
        ],
    },
];

// Flat lookup array of all components
export const ALL_COMPONENTS = COMPONENT_SECTIONS.flatMap(section => section.items);

// Keyed lookup by ID
export const COMPONENT_MAP = Object.fromEntries(
    ALL_COMPONENTS.map(comp => [comp.id, comp])
);

