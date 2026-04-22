export interface ProductChoice {
  value: string;
  label: string;
  priceAdd?: number;
  color?: string;
  available?: boolean;
  badge?: string;
}

export interface ProductOption {
  id: string;
  label: string;
  type: "select" | "color" | "radio";
  choices: ProductChoice[];
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductVariantFull {
  slug: string;
  name: string;
  tagline: string;
  basePrice: number;
  comparePrice?: number;
  category: string;
  description: string;
  longDescription: string;
  badge?: string;
  inStock: boolean;
  rating: { average: number; count: number };
  options: ProductOption[];
  specs: ProductSpec[];
  includes: string[];
  images: string[];
}

// ─── Options partagées ────────────────────────────────────────────────────────

const CASING_OPTIONS: ProductOption = {
  id: "casing",
  label: "Boîtier",
  type: "radio",
  choices: [
    { value: "pla",      label: "PLA 3D (par défaut)",  priceAdd: 0,   badge: "Inclus",    available: true },
    { value: "petg",     label: "PETG 3D — Renforcé",   priceAdd: 8,   available: true },
    { value: "abs",      label: "ABS 3D — Résistant",   priceAdd: 12,  available: true },
    { value: "aluminum", label: "CNC Aluminium",        priceAdd: 50,  badge: "Premium",   available: true },
  ],
};

const COLOR_OPTIONS: ProductOption = {
  id: "color",
  label: "Couleur boîtier",
  type: "color",
  choices: [
    { value: "black",  label: "Noir mat",      color: "#1a1a1a", available: true },
    { value: "white",  label: "Blanc cassé",   color: "#e8e0d0", available: true },
    { value: "purple", label: "Violet deep",   color: "#5b21b6", available: true, badge: "Limité" },
    { value: "gray",   label: "Gris sidéral",  color: "#6b7280", available: true },
    { value: "custom", label: "Couleur custom (RAL)", color: "linear-gradient(135deg,#f43f5e,#8b5cf6,#06b6d4)", priceAdd: 15, available: true },
  ],
};

const SWITCH_OPTIONS: ProductOption = {
  id: "switches",
  label: "Switches",
  type: "radio",
  choices: [
    { value: "mx-red",         label: "Cherry MX Red — Linéaire",       priceAdd: 0,  available: true, badge: "Populaire" },
    { value: "mx-brown",       label: "Cherry MX Brown — Tactile",      priceAdd: 0,  available: true },
    { value: "mx-silent-red",  label: "Cherry MX Silent Red — Silencieux", priceAdd: 6, available: true },
    { value: "mx-silent-brown",label: "Cherry MX Silent Brown",         priceAdd: 6,  available: true },
    { value: "mx-blue",        label: "Cherry MX Blue — Clicky",        priceAdd: 0,  available: true },
  ],
};

const FIRMWARE_OPTIONS: ProductOption = {
  id: "firmware",
  label: "Firmware",
  type: "select",
  choices: [
    { value: "circuitpython", label: "CircuitPython (recommandé)", available: true },
    { value: "kmk",           label: "KMK Firmware",              available: true },
    { value: "qmk-compat",    label: "QMK-compatible (expérimental)", available: true, badge: "Beta" },
  ],
};

// ─── Produits ─────────────────────────────────────────────────────────────────

export const PRODUCTS: Record<string, ProductVariantFull> = {
  "axion-pad-standard": {
    slug: "axion-pad-standard",
    name: "Axion Pad Standard",
    tagline: "Le macro pad essentiel pour ton workflow",
    basePrice: 79.99,
    comparePrice: 99.99,
    category: "macro-pads",
    badge: "Best-seller",
    inStock: true,
    rating: { average: 4.9, count: 128 },
    description: "12 touches mécaniques + 4 potentiomètres sur RP2040. Boîtier imprimé en 3D, firmware CircuitPython.",
    longDescription: "L'Axion Pad Standard est le point d'entrée parfait dans l'univers des macro pads programmables. Avec ses 12 touches mécaniques Cherry MX et ses 4 potentiomètres ALPS, il te permet de contrôler n'importe quelle application en un geste. Le boîtier est imprimé en 3D en PLA par défaut, personnalisable à la commande.",
    options: [CASING_OPTIONS, COLOR_OPTIONS, SWITCH_OPTIONS, FIRMWARE_OPTIONS],
    specs: [
      { label: "MCU",           value: "RP2040 Dual-core 133 MHz" },
      { label: "Touches",       value: "12 × Cherry MX" },
      { label: "Potentiomètres", value: "4 × ALPS RK09L" },
      { label: "Connecteur",    value: "USB-C Gen 2" },
      { label: "Boîtier",       value: "PLA 3D (autres options dispo)" },
      { label: "Dimensions",    value: "120 × 80 × 22 mm" },
      { label: "Poids",         value: "~145 g (boîtier PLA)" },
      { label: "Compatibilité", value: "Windows / macOS / Linux" },
      { label: "Firmware",      value: "CircuitPython open-source" },
    ],
    includes: [
      "1 × Axion Pad assemblé",
      "1 × Câble USB-C 1m",
      "Firmware pré-installé",
      "Guide de configuration (PDF)",
    ],
    images: [],
  },

  "axion-pad-pro": {
    slug: "axion-pad-pro",
    name: "Axion Pad Pro",
    tagline: "Version premium avec boîtier aluminium CNC",
    basePrice: 129.99,
    comparePrice: 159.99,
    category: "macro-pads",
    badge: "Nouveau",
    inStock: true,
    rating: { average: 5.0, count: 64 },
    description: "Boîtier aluminium CNC anodisé, RGB underglow, switches premium.",
    longDescription: "L'Axion Pad Pro pousse l'expérience encore plus loin avec un boîtier usiné CNC en aluminium anodisé. Le RGB underglow ajoute une ambiance lumineuse sous le pad, synchronisable avec ton setup.",
    options: [
      {
        ...COLOR_OPTIONS,
        choices: [
          { value: "black-ano",  label: "Noir anodisé",   color: "#0f0f0f", available: true },
          { value: "silver",     label: "Argent brossé",  color: "#c0c0c0", available: true },
          { value: "space-gray", label: "Space Gray",     color: "#4a4a4a", available: true },
          { value: "gold",       label: "Champagne Gold", color: "#d4af37", available: true, badge: "Limité" },
        ],
      },
      SWITCH_OPTIONS,
      {
        id: "rgb",
        label: "RGB Underglow",
        type: "radio",
        choices: [
          { value: "rgb-on",  label: "Activé (16 LEDs WS2812B)", priceAdd: 0,  available: true, badge: "Inclus" },
          { value: "rgb-off", label: "Sans RGB",                 priceAdd: -8, available: true },
        ],
      },
      FIRMWARE_OPTIONS,
    ],
    specs: [
      { label: "MCU",           value: "RP2040 Dual-core 133 MHz" },
      { label: "Touches",       value: "12 × Cherry MX" },
      { label: "Potentiomètres", value: "4 × ALPS RK09L" },
      { label: "Boîtier",       value: "Aluminium 6061 CNC anodisé" },
      { label: "RGB",           value: "16 LEDs WS2812B underglow" },
      { label: "Connecteur",    value: "USB-C Gen 2 + port TRRS" },
      { label: "Dimensions",    value: "122 × 82 × 20 mm" },
      { label: "Poids",         value: "~320 g" },
    ],
    includes: [
      "1 × Axion Pad Pro assemblé",
      "1 × Câble USB-C tressé 1.5m",
      "1 × Set de 12 keycaps translucides",
      "Firmware pré-installé",
      "Certificat de calibration",
    ],
    images: [],
  },

  "axion-pad-mini": {
    slug: "axion-pad-mini",
    name: "Axion Pad Mini",
    tagline: "Format ultracompact pour setup minimaliste",
    basePrice: 59.99,
    category: "macro-pads",
    inStock: false,
    rating: { average: 4.6, count: 31 },
    description: "6 touches dans un format minimaliste 3×2. Idéal pour les raccourcis essentiels.",
    longDescription: "L'Axion Pad Mini concentre l'essentiel en 6 touches mécaniques. Format 3×2 ultra-compact, il se glisse partout et se configure en quelques minutes.",
    options: [CASING_OPTIONS, COLOR_OPTIONS, SWITCH_OPTIONS],
    specs: [
      { label: "MCU",     value: "RP2040" },
      { label: "Touches", value: "6 × Cherry MX" },
      { label: "Boîtier", value: "PLA 3D (par défaut)" },
      { label: "Format",  value: "3×2 touches" },
      { label: "Dims",    value: "70 × 55 × 20 mm" },
    ],
    includes: ["1 × Axion Pad Mini", "1 × Câble USB-C 1m", "Firmware pré-installé"],
    images: [],
  },

  "axion-pad-xl": {
    slug: "axion-pad-xl",
    name: "Axion Pad XL",
    tagline: "Studio grade — 16 touches + écran OLED",
    basePrice: 179.99,
    comparePrice: 199.99,
    category: "macro-pads",
    inStock: true,
    rating: { average: 4.9, count: 22 },
    description: "4×4 touches, 6 potentiomètres, écran OLED 128×32 intégré.",
    longDescription: "Pour les créatifs qui veulent tout contrôler. L'Axion Pad XL embarque 16 touches, 6 potentiomètres et un écran OLED affichant les mappings en temps réel.",
    options: [
      CASING_OPTIONS,
      COLOR_OPTIONS,
      SWITCH_OPTIONS,
      {
        id: "oled",
        label: "Écran OLED",
        type: "radio",
        choices: [
          { value: "oled-128",  label: "OLED 128×32 (inclus)",   priceAdd: 0,   available: true, badge: "Inclus" },
          { value: "oled-none", label: "Sans écran",              priceAdd: -15, available: true },
        ],
      },
      FIRMWARE_OPTIONS,
    ],
    specs: [
      { label: "MCU",           value: "RP2040 Dual-core 133 MHz" },
      { label: "Touches",       value: "16 × Cherry MX (4×4)" },
      { label: "Potentiomètres", value: "6 × ALPS RK09L" },
      { label: "Écran",         value: "OLED 128×32 I2C" },
      { label: "Boîtier",       value: "PLA 3D (par défaut)" },
      { label: "Connecteur",    value: "USB-C Gen 2" },
      { label: "Dims",          value: "180 × 110 × 25 mm" },
    ],
    includes: ["1 × Axion Pad XL", "1 × Câble USB-C 1.5m", "Firmware pré-installé", "Support inclinable 15°"],
    images: [],
  },

  "axion-kit-diy": {
    slug: "axion-kit-diy",
    name: "Kit DIY Axion",
    tagline: "Construis ton propre macro pad",
    basePrice: 49.99,
    category: "kits",
    inStock: true,
    rating: { average: 4.7, count: 42 },
    description: "PCB, RP2040 et composants fournis. Boîtier STL inclus pour impression 3D.",
    longDescription: "Le kit DIY te fourni tout le nécessaire : PCB nu RP2040, composants (potentiomètres, résistances, connecteur USB-C), et les fichiers STL du boîtier pour l'imprimer toi-même. Soudage requis.",
    options: [
      {
        id: "assembly",
        label: "Niveau d'assemblage",
        type: "radio",
        choices: [
          { value: "kit-bare",    label: "Kit nu (composants + PCB)",         priceAdd: 0,  available: true },
          { value: "kit-soldered",label: "Composants pré-soudés + PCB",       priceAdd: 15, available: true, badge: "Gain de temps" },
          { value: "kit-full",    label: "Kit complet pré-assemblé sans boîtier", priceAdd: 25, available: true },
        ],
      },
      {
        id: "switches-kit",
        label: "Switches (optionnel)",
        type: "radio",
        choices: [
          { value: "no-switches",  label: "Sans switches (BYOS)",    priceAdd: 0,  available: true },
          { value: "mx-red-kit",   label: "+ Cherry MX Red × 12",    priceAdd: 18, available: true },
          { value: "mx-brown-kit", label: "+ Cherry MX Brown × 12",  priceAdd: 18, available: true },
        ],
      },
    ],
    specs: [
      { label: "PCB",       value: "4 couches FR4, RP2040" },
      { label: "STL",       value: "Fichiers inclus (impression 3D)" },
      { label: "Soudage",   value: "Requis (kit nu)" },
      { label: "Outils",    value: "Fer à souder recommandé" },
    ],
    includes: [
      "1 × PCB Axion Pad",
      "Tous les composants CMS",
      "1 × RP2040 pré-flashé",
      "4 × Potentiomètres ALPS",
      "Fichiers STL boîtier (Impression 3D)",
      "Guide d'assemblage PDF",
    ],
    images: [],
  },

  "kit-pcb": {
    slug: "kit-pcb",
    name: "Kit PCB seul",
    tagline: "PCB RP2040 pour projets custom",
    basePrice: 22.99,
    category: "kits",
    inStock: true,
    rating: { average: 4.4, count: 18 },
    description: "PCB RP2040 nu 4 couches. Soudage requis.",
    longDescription: "Le PCB seul pour les makers qui veulent construire un boîtier entièrement custom. Tout-monté côté SMD, tu n'as qu'à souder les switches et les potentiomètres.",
    options: [
      {
        id: "pcb-version",
        label: "Version PCB",
        type: "radio",
        choices: [
          { value: "v1", label: "V1 — Version originale",        priceAdd: 0,  available: true },
          { value: "v3", label: "V3 — Pins espacées (amélioré)", priceAdd: 3,  available: true, badge: "Recommandé" },
        ],
      },
    ],
    specs: [
      { label: "MCU",     value: "RP2040" },
      { label: "Couches", value: "4 couches FR4" },
      { label: "Dims",    value: "80 × 60 mm" },
      { label: "Flash",   value: "2 MB QSPI" },
    ],
    includes: ["1 × PCB Axion Pad", "1 × RP2040 pré-soudé"],
    images: [],
  },

  "cable-usbc": {
    slug: "cable-usbc",
    name: "Câble USB-C Tressé",
    tagline: "Câble premium pour Axion Pad",
    basePrice: 12.99,
    category: "accessories",
    inStock: true,
    rating: { average: 4.8, count: 95 },
    description: "USB-C vers USB-A tressé 1.8m. Compatible Axion Pad.",
    longDescription: "Câble USB-C tressé haute qualité, compatible avec tous les modèles Axion Pad. Gaine tressée renforcée, connecteurs plaqués or.",
    options: [
      {
        id: "length",
        label: "Longueur",
        type: "radio",
        choices: [
          { value: "1m",   label: "1 m",   priceAdd: -2,  available: true },
          { value: "1.8m", label: "1.8 m", priceAdd: 0,   available: true, badge: "Standard" },
          { value: "3m",   label: "3 m",   priceAdd: 4,   available: true },
        ],
      },
      {
        id: "cable-color",
        label: "Couleur",
        type: "color",
        choices: [
          { value: "black",  label: "Noir",    color: "#1a1a1a", available: true },
          { value: "white",  label: "Blanc",   color: "#f0f0f0", available: true },
          { value: "purple", label: "Violet",  color: "#7c3aed", available: true },
        ],
      },
    ],
    specs: [
      { label: "Type",       value: "USB-C → USB-A" },
      { label: "Gaine",      value: "Tressé nylon renforcé" },
      { label: "Connecteurs", value: "Plaqués or 24K" },
      { label: "Débit",      value: "USB 2.0 480 Mbit/s" },
    ],
    includes: ["1 × Câble USB-C tressé"],
    images: [],
  },

  "keycaps-custom": {
    slug: "keycaps-custom",
    name: "Kit Keycaps Custom",
    tagline: "12 keycaps translucides pour Axion Pad",
    basePrice: 24.99,
    category: "accessories",
    inStock: true,
    rating: { average: 4.5, count: 57 },
    description: "Set de 12 keycaps en PBT translucide pour rétroéclairage.",
    longDescription: "Keycaps en PBT double-shot translucide, compatibles Cherry MX et clones. Idéales pour les builds avec rétroéclairage RGB.",
    options: [
      {
        id: "keycap-profile",
        label: "Profil",
        type: "radio",
        choices: [
          { value: "oem",  label: "OEM (hauteur standard)", priceAdd: 0,  available: true },
          { value: "dsa",  label: "DSA (hauteur uniforme)",  priceAdd: 3,  available: true },
          { value: "xda",  label: "XDA — Flat",              priceAdd: 3,  available: true },
        ],
      },
      {
        id: "keycap-color",
        label: "Coloris",
        type: "color",
        choices: [
          { value: "clear",  label: "Transparent",    color: "rgba(255,255,255,0.15)", available: true },
          { value: "smoke",  label: "Fumé",           color: "#374151", available: true },
          { value: "purple", label: "Violet translucide", color: "#5b21b6", available: true },
          { value: "white",  label: "Blanc laiteux",  color: "#e5e7eb", available: true },
        ],
      },
    ],
    specs: [
      { label: "Matériau",     value: "PBT double-shot" },
      { label: "Compatibilité", value: "Cherry MX + clones" },
      { label: "Quantité",     value: "12 keycaps" },
      { label: "Inscription",  value: "Sans (blank)" },
    ],
    includes: ["12 × Keycaps PBT", "Outil de retrait"],
    images: [],
  },

  "support-bureau": {
    slug: "support-bureau",
    name: "Support Bureau",
    tagline: "Support inclinable aluminium pour Axion Pad",
    basePrice: 18.99,
    category: "accessories",
    inStock: true,
    rating: { average: 4.7, count: 44 },
    description: "Support inclinable aluminium. Angles 15° et 30°.",
    longDescription: "Support en aluminium brossé compatible avec tous les modèles Axion Pad. Deux positions d'inclinaison (15° et 30°) pour un confort optimal.",
    options: [
      {
        id: "support-color",
        label: "Finition",
        type: "color",
        choices: [
          { value: "silver", label: "Aluminium brossé", color: "#c0c0c0", available: true },
          { value: "black",  label: "Aluminium noir",   color: "#1a1a1a", available: true },
        ],
      },
    ],
    specs: [
      { label: "Matériau",  value: "Aluminium 6061 brossé" },
      { label: "Angles",    value: "15° / 30° (ajustable)" },
      { label: "Compat.",   value: "Tous modèles Axion Pad" },
      { label: "Poids",     value: "85 g" },
    ],
    includes: ["1 × Support bureau", "2 × Vis de fixation"],
    images: [],
  },
};

export function getProduct(slug: string): ProductVariantFull | null {
  return PRODUCTS[slug] ?? null;
}

export function getAllProducts(): ProductVariantFull[] {
  return Object.values(PRODUCTS);
}
