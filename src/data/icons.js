// List of all available icon files in public/icons/
// Naturally ordered for clean grouping and presentation
export const ICON_FILENAMES = [
    "1A.png", "1B.png", "2A.png", "2B.png", "3A.png", "3B.png", "4A.png", "4B.png",
    "5A.png", "5B.png", "6A.png", "6B.png", "7A.png", "7B.png", "8A.png", "8B.png",
    "9A.png", "9B.png", "10A.png", "10B.png", "11A.png", "11B.png", "12A.png", "12B.png",
    "13A.png", "13B.png", "14A.png", "14B.png", "15A.png", "15B.png", "16A.png", "16B.png",
    "17A.png", "17B.png", "18A.png", "18B.png", "19A.png", "19B.png", "20A.png", "20B.png",
    "20C.png", "20D.png", "20E.png", "20F.png", "20G.png", "20H.png", "20I.png", "20J.png",
    "20K.png", "20L.png", "20M.png", "20N.png", "20O.png", "20P.png", "20Q.png", "20R.png",
    "21A.png", "21B.png", "21C.png", "21D.png", "21E.png", "21F.png", "21G.png", "21H.png",
    "21I.png", "21J.png", "21K.png", "21L.png", "21M.png", "21N.png", "21O.png", "21P.png",
    "21Q.png", "21R.png", "21S.png", "21T.png", "21U.png", "21V.png", "21W.png", "21X.png",
    "21Y.png", "21Z.png", "22.png", "23.png", "24A.png", "24B.png", "25A.png", "26A.png",
    "27A.png", "28A.png", "29A.png", "30A.png", "31A.png", "32A.png", "33A.png", "34A.png",
    "35A.png", "36A.png", "37A.png", "38A.png", "39A.png", "40A.png", "41A.png", "41B.png",
    "52A.png", "53A.png", "54.png", "55.png", "56.png"
];

// Helper to convert filename to structured icon object
export const ICONS = ICON_FILENAMES.map((filename) => {
    const id = filename.replace(/\.png$/, "");
    return {
        id,
        name: `Icon ${id}`,
        filename,
        src: `./icons/${filename}`,
    };
});
