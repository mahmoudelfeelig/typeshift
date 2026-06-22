import {
  Atkinson_Hyperlegible,
  Chakra_Petch,
  Manrope,
  Syne,
} from "next/font/google";

export const fontBody = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const fontDisplay = Syne({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const fontUi = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

export const fontAccessible = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-accessible",
  display: "swap",
});
