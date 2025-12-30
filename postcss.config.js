/**
 * PostCSS Configuration for Cross-Browser Compatibility
 *
 * Automatically adds vendor prefixes for:
 * - Chrome/Edge (webkit)
 * - Safari (webkit)
 * - Firefox (moz)
 * - Legacy browsers
 *
 * Supports last 2 versions of all major browsers
 */

export default {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 Edge versions',
        'last 2 iOS versions',
        'last 2 ChromeAndroid versions',
      ],
      grid: 'autoplace', // Enable CSS Grid prefixes
      flexbox: 'no-2009', // Modern flexbox only
    },
  },
};
