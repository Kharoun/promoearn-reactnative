/**
 * typography.ts
 * Central font definitions using Poppins.
 * Usage: import { fonts } from "../utils/typography";
 * Then in StyleSheet: fontFamily: fonts.regular
 */

export const fonts = {
    regular:   "Poppins_400Regular",
    medium:    "Poppins_500Medium",
    semibold:  "Poppins_600SemiBold",
    bold:      "Poppins_700Bold",
    extrabold: "Poppins_800ExtraBold",
    black:     "Poppins_900Black",
  };
  
  /**
   * Quick text style helpers.
   * Usage: <Text style={typography.h1}>Hello</Text>
   */
  export const typography = {
    h1:      { fontFamily: fonts.black,     fontSize: 32, letterSpacing: -0.5 },
    h2:      { fontFamily: fonts.extrabold, fontSize: 26, letterSpacing: -0.5 },
    h3:      { fontFamily: fonts.bold,      fontSize: 20 },
    h4:      { fontFamily: fonts.semibold,  fontSize: 17 },
    body:    { fontFamily: fonts.regular,   fontSize: 15, lineHeight: 24 },
    bodyMd:  { fontFamily: fonts.medium,    fontSize: 15 },
    small:   { fontFamily: fonts.regular,   fontSize: 13, lineHeight: 20 },
    smallMd: { fontFamily: fonts.medium,    fontSize: 13 },
    label:   { fontFamily: fonts.semibold,  fontSize: 12, letterSpacing: 0.5 },
    caption: { fontFamily: fonts.regular,   fontSize: 11, color: "#94A3B8" },
    button:  { fontFamily: fonts.bold,      fontSize: 15, letterSpacing: 0.3 },
  };