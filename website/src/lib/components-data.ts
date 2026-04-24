export interface ComponentInfo {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  specs: { label: string; value: string }[];
  color: string;
}

export const COMPONENTS: Record<string, ComponentInfo> = {
  body: {
    slug: "body",
    name: "Coque principale",
    subtitle: "Boîtier en plastique ABS premium",
    description: "Conçue pour allier légèreté et robustesse. La coque principale loge les 12 touches mécaniques et le PCB dans un format compact qui s'intègre naturellement à n'importe quel setup.",
    specs: [
      { label: "Matériau",   value: "ABS + fibre de verre" },
      { label: "Dimensions", value: "120 × 80 × 22 mm" },
      { label: "Poids",      value: "145 g" },
      { label: "Finition",   value: "Matte soft-touch" },
    ],
    color: "#7c3aed",
  },
  top: {
    slug: "top",
    name: "Couvercle",
    subtitle: "Plaque supérieure amovible",
    description: "Le couvercle amovible permet un accès rapide à l'intérieur pour les modifications DIY. Sa fixation par enclipsage garantit un maintien solide sans vis apparentes.",
    specs: [
      { label: "Matériau",    value: "Polycarbonate transparent" },
      { label: "Fixation",    value: "Enclipsage magnétique" },
      { label: "Compatibilité", value: "Toutes versions Axion Pad" },
    ],
    color: "#6d28d9",
  },
  bottom: {
    slug: "bottom",
    name: "Base",
    subtitle: "Semelle antidérapante",
    description: "La base en caoutchouc vulcanisé maintient l'Axion Pad en place sur toutes les surfaces. Les patins en silicone amortissent les vibrations lors des frappes intenses.",
    specs: [
      { label: "Matériau", value: "Caoutchouc vulcanisé + silicone" },
      { label: "Adhérence", value: "Antidérapant toutes surfaces" },
      { label: "Épaisseur", value: "3 mm" },
    ],
    color: "#4c1d95",
  },
  pcb: {
    slug: "pcb",
    name: "PCB RP2040",
    subtitle: "Carte électronique sur mesure",
    description: "Conçu en interne autour du microcontrôleur RP2040 de Raspberry Pi. Le PCB intègre les 12 emplacements MX Kailh Hot-swap, 4 potentiomètres ALPS et l'interface USB-C en un circuit compact 2 couches haute stabilité.",
    specs: [
      { label: "MCU",         value: "RP2040 — Dual-core ARM Cortex-M0+" },
      { label: "Fréquence",   value: "133 MHz" },
      { label: "Flash",       value: "2 MB QSPI" },
      { label: "Firmware",    value: "CircuitPython (open-source)" },
      { label: "Connecteur",  value: "USB-C Gen 2" },
      { label: "Couches PCB", value: "2 couches FR4 haute stabilité" },
    ],
    color: "#059669",
  },
  switches: {
    slug: "switches",
    name: "Switches Cherry MX",
    subtitle: "12 touches mécaniques de qualité",
    description: "Les switches Cherry MX montés sur sockets Kailh Hot-swap offrent un retour tactile précis et une durabilité de 100 millions de frappes. Swap sans soudure en quelques secondes. Disponibles en version Red (linéaire) ou Brown (tactile).",
    specs: [
      { label: "Type",        value: "Cherry MX Red / Brown" },
      { label: "Montage",     value: "Kailh Hot-swap (sans soudure)" },
      { label: "Durabilité",  value: "100 millions de frappes" },
      { label: "Actuation",   value: "2 mm / 4 mm total" },
      { label: "Force",       value: "45 cN (Red) / 55 cN (Brown)" },
      { label: "Backlight",   value: "Compatible LED 3mm" },
    ],
    color: "#dc2626",
  },
};

export function getComponent(slug: string): ComponentInfo | null {
  return COMPONENTS[slug] ?? null;
}
