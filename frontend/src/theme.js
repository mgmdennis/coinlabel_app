import { createTheme } from '@mantine/core';

// NumisTag brand palette. The logo/navbar use a dark slate (#24313E) with
// blue accents, so we register a "brand" slate scale and use a clean blue as
// the primary interactive color.
export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily:
    "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headings: {
    fontFamily:
      "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: '700',
  },
  defaultRadius: 'md',
  colors: {
    slate: [
      '#f4f6f8',
      '#e6eaee',
      '#c9d2da',
      '#a7b5c1',
      '#8595a6',
      '#5f6f80',
      '#465768',
      '#33414f',
      '#24313E',
      '#1a232d',
    ],
  },
});
