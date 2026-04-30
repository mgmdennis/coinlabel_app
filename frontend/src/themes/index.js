import * as SheltonTheme from './shelton/SheltonTheme';
import * as HeritageTheme from './heritage/HeritageTheme';

/**
 * Theme registry — add new themes here.
 * Each entry maps a display name to { FrontLabel, BackLabel }.
 *
 * - FrontLabel: renders the front side of the coin label
 * - BackLabel:  renders the back side (defaults to the shared BackLabel component)
 *
 * A theme component receives all label field props and is responsible for its own layout.
 */
const labelThemes = {
    "The Shelton": SheltonTheme,
    "The Heritage": HeritageTheme,
};

export default labelThemes;

/** Ordered list of theme names for use in dropdowns/selectors. */
export const themeNames = Object.keys(labelThemes);
