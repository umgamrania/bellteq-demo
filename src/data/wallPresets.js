// Preset wall and room backgrounds for the Wall Visualizer stage
// Built with self-contained high-res SVG data URLs for instant offline rendering without external dependencies

export const WALL_PRESETS = [
    {
        id: "modern-living",
        name: "Warm Living Room",
        description: "Cozy warm interior wall with ambient spotlight",
        thumbnail: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
                <defs>
                    <radialGradient id="light" cx="50%" cy="20%" r="70%">
                        <stop offset="0%" stop-color="#fff8f0" stop-opacity="0.9"/>
                        <stop offset="60%" stop-color="#e8ded1" stop-opacity="0.95"/>
                        <stop offset="100%" stop-color="#cfc0ad" stop-opacity="1"/>
                    </radialGradient>
                    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#8b5e3c"/>
                        <stop offset="100%" stop-color="#5c3a21"/>
                    </linearGradient>
                </defs>
                <rect width="800" height="420" fill="url(#light)"/>
                <!-- Baseboard -->
                <rect y="414" width="800" height="8" fill="#f5f0e8" stroke="#d5c8b5" stroke-width="1"/>
                <!-- Wood Floor -->
                <rect y="420" width="800" height="80" fill="url(#floor)"/>
                <!-- Floor Planks -->
                <line x1="0" y1="445" x2="800" y2="445" stroke="#482d19" stroke-width="1" opacity="0.4"/>
                <line x1="0" y1="475" x2="800" y2="475" stroke="#482d19" stroke-width="1" opacity="0.4"/>
            </svg>
        `),
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
                <defs>
                    <radialGradient id="warmGlow" cx="50%" cy="25%" r="75%">
                        <stop offset="0%" stop-color="#faf5ee"/>
                        <stop offset="45%" stop-color="#ece4d8"/>
                        <stop offset="100%" stop-color="#cfc1af"/>
                    </radialGradient>
                    <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#9a6b45"/>
                        <stop offset="25%" stop-color="#7e5332"/>
                        <stop offset="100%" stop-color="#51331c"/>
                    </linearGradient>
                    <filter id="wallNoise" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.035 0"/>
                        <feComposite in2="SourceGraphic" in="gl" operator="over"/>
                    </filter>
                </defs>
                <!-- Wall background -->
                <rect width="1600" height="840" fill="url(#warmGlow)"/>
                <!-- Baseboard moulding -->
                <rect y="828" width="1600" height="14" fill="#f8f4ed" stroke="#d6cabc" stroke-width="1.5"/>
                <!-- Wood Floor -->
                <rect y="840" width="1600" height="160" fill="url(#floorGrad)"/>
                <!-- Wood floor perspective lines -->
                <line x1="0" y1="890" x2="1600" y2="890" stroke="#3b2311" stroke-width="1.5" opacity="0.4"/>
                <line x1="0" y1="945" x2="1600" y2="945" stroke="#3b2311" stroke-width="1.5" opacity="0.4"/>
                <line x1="300" y1="840" x2="150" y2="1000" stroke="#3b2311" stroke-width="1" opacity="0.3"/>
                <line x1="700" y1="840" x2="600" y2="1000" stroke="#3b2311" stroke-width="1" opacity="0.3"/>
                <line x1="1100" y1="840" x2="1050" y2="1000" stroke="#3b2311" stroke-width="1" opacity="0.3"/>
                <line x1="1450" y1="840" x2="1480" y2="1000" stroke="#3b2311" stroke-width="1" opacity="0.3"/>
            </svg>
        `),
    },
    {
        id: "luxury-dark-slate",
        name: "Luxury Dark Slate",
        description: "Modern dark charcoal wall with focused downlight",
        thumbnail: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
                <defs>
                    <radialGradient id="darkLight" cx="50%" cy="15%" r="70%">
                        <stop offset="0%" stop-color="#3d4450"/>
                        <stop offset="45%" stop-color="#242933"/>
                        <stop offset="100%" stop-color="#14181f"/>
                    </radialGradient>
                </defs>
                <rect width="800" height="425" fill="url(#darkLight)"/>
                <rect y="420" width="800" height="6" fill="#1b1e24"/>
                <rect y="425" width="800" height="75" fill="#0f1115"/>
            </svg>
        `),
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
                <defs>
                    <radialGradient id="darkGlow" cx="50%" cy="20%" r="75%">
                        <stop offset="0%" stop-color="#3b424e"/>
                        <stop offset="40%" stop-color="#252a34"/>
                        <stop offset="100%" stop-color="#13171e"/>
                    </radialGradient>
                    <linearGradient id="darkFloor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#1b1e24"/>
                        <stop offset="100%" stop-color="#0c0e12"/>
                    </linearGradient>
                </defs>
                <rect width="1600" height="850" fill="url(#darkGlow)"/>
                <!-- Dark baseboard -->
                <rect y="838" width="1600" height="14" fill="#2d333e" stroke="#1c2028" stroke-width="1.5"/>
                <!-- Dark tile floor -->
                <rect y="850" width="1600" height="150" fill="url(#darkFloor)"/>
                <line x1="0" y1="915" x2="1600" y2="915" stroke="#000000" stroke-width="1.5" opacity="0.6"/>
                <line x1="400" y1="850" x2="250" y2="1000" stroke="#000000" stroke-width="1" opacity="0.4"/>
                <line x1="900" y1="850" x2="850" y2="1000" stroke="#000000" stroke-width="1" opacity="0.4"/>
                <line x1="1350" y1="850" x2="1400" y2="1000" stroke="#000000" stroke-width="1" opacity="0.4"/>
            </svg>
        `),
    },
    {
        id: "minimal-grey",
        name: "Minimalist Concrete",
        description: "Clean neutral concrete / light grey architectural wall",
        thumbnail: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
                <defs>
                    <radialGradient id="greyLight" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#f0f2f5"/>
                        <stop offset="60%" stop-color="#dce0e6"/>
                        <stop offset="100%" stop-color="#c2c7cf"/>
                    </radialGradient>
                </defs>
                <rect width="800" height="430" fill="url(#greyLight)"/>
                <rect y="425" width="800" height="6" fill="#ffffff"/>
                <rect y="430" width="800" height="70" fill="#a4abb5"/>
            </svg>
        `),
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
                <defs>
                    <radialGradient id="greyWall" cx="50%" cy="30%" r="75%">
                        <stop offset="0%" stop-color="#f3f5f8"/>
                        <stop offset="50%" stop-color="#dee2e8"/>
                        <stop offset="100%" stop-color="#c3c8d2"/>
                    </radialGradient>
                    <linearGradient id="polishedFloor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#b0b7c2"/>
                        <stop offset="100%" stop-color="#88909c"/>
                    </linearGradient>
                </defs>
                <rect width="1600" height="860" fill="url(#greyWall)"/>
                <rect y="848" width="1600" height="14" fill="#ffffff" stroke="#cbd0d8" stroke-width="1.5"/>
                <rect y="860" width="1600" height="140" fill="url(#polishedFloor)"/>
            </svg>
        `),
    },
    {
        id: "wood-accent",
        name: "Warm Wood Accent",
        description: "Vertical acoustic wood slat feature wall",
        thumbnail: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
                <rect width="800" height="500" fill="#201c18"/>
                <defs>
                    <pattern id="thumbSlats" width="20" height="500" patternUnits="userSpaceOnUse">
                        <rect x="0" width="14" height="500" fill="#b88355"/>
                        <rect x="14" width="6" height="500" fill="#181512"/>
                    </pattern>
                </defs>
                <rect width="800" height="430" fill="url(#thumbSlats)"/>
                <rect y="430" width="800" height="70" fill="#2d2822"/>
            </svg>
        `),
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
                <defs>
                    <pattern id="woodSlats" width="36" height="850" patternUnits="userSpaceOnUse">
                        <rect x="0" width="25" height="850" fill="#bd8757"/>
                        <rect x="2" width="21" height="850" fill="#c69261" opacity="0.7"/>
                        <rect x="25" width="11" height="850" fill="#1e1813"/>
                    </pattern>
                    <radialGradient id="slatShadow" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
                        <stop offset="70%" stop-color="#000000" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
                    </radialGradient>
                </defs>
                <rect width="1600" height="850" fill="url(#woodSlats)"/>
                <rect width="1600" height="850" fill="url(#slatShadow)"/>
                <rect y="840" width="1600" height="14" fill="#2b231d"/>
                <rect y="850" width="1600" height="150" fill="#1a1512"/>
            </svg>
        `),
    },
    {
        id: "clean-white",
        name: "Clean Studio White",
        description: "Bright pure white wall with delicate shadow gradients",
        thumbnail: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
                <defs>
                    <radialGradient id="whiteLight" cx="50%" cy="20%" r="75%">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="70%" stop-color="#f4f5f7"/>
                        <stop offset="100%" stop-color="#e3e6ec"/>
                    </radialGradient>
                </defs>
                <rect width="800" height="430" fill="url(#whiteLight)"/>
                <rect y="426" width="800" height="6" fill="#ffffff" stroke="#e0e4eb"/>
                <rect y="430" width="800" height="70" fill="#eceff5"/>
            </svg>
        `),
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
                <defs>
                    <radialGradient id="pureGlow" cx="50%" cy="25%" r="75%">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="55%" stop-color="#f6f7fa"/>
                        <stop offset="100%" stop-color="#e3e7ee"/>
                    </radialGradient>
                    <linearGradient id="lightFloor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#e8ecf2"/>
                        <stop offset="100%" stop-color="#cfd6e2"/>
                    </linearGradient>
                </defs>
                <rect width="1600" height="860" fill="url(#pureGlow)"/>
                <rect y="848" width="1600" height="14" fill="#ffffff" stroke="#dde2eb" stroke-width="1.5"/>
                <rect y="860" width="1600" height="140" fill="url(#lightFloor)"/>
            </svg>
        `),
    },
];

