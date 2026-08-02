/**
 * Aceternity UI — komponen yang diport tangan ke CareerPack.
 *
 * Aceternity mendistribusikan source untuk disalin, bukan sebagai paket npm,
 * jadi setiap berkas di sini adalah port manual: dependency `motion/react`
 * (dan `three` pada Card Spotlight) dibuang dan diganti CSS, seluruh palet
 * hardcoded diganti token desain proyek, dan efek acak diganti nilai
 * deterministik agar aman untuk SSR. Setiap berkas mencantumkan URL asalnya.
 *
 * Hanya lima komponen ini yang diport — sisanya benar-benar butuh
 * `framer-motion`, dan menambah dependency ke landing page bukan pilihan.
 */
export { Spotlight, type SpotlightProps } from "./Spotlight";
export { GridBackground, type GridBackgroundProps } from "./GridBackground";
export { DotBackground, type DotBackgroundProps } from "./DotBackground";
export { CardSpotlight, type CardSpotlightProps } from "./CardSpotlight";
export {
  HoverBorderGradient,
  type HoverBorderGradientProps,
} from "./HoverBorderGradient";
export { Meteors, type MeteorsProps } from "./Meteors";
