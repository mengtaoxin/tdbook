import { alpha, createTheme } from '@mui/material/styles';

const primaryMain = '#3D5A80';
const backgroundDefault = '#fafafa';
const scrollbarTrack = '#e7ebf0';
const scrollbarThumb = alpha(primaryMain, 0.72);
const scrollbarThumbHover = primaryMain;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
    },
    background: {
      default: backgroundDefault,
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
      },
    },
    // Overlay scrollbars only keep `scrollbar-gutter: stable` while the page
    // overflows. Modal scroll lock drops that gutter and adds padding-right,
    // which shifts the page width (nav menus and confirm dialogs).
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    // Reader bar: narrower than the OS scrollbar, with a compact inset thumb.
    // The macOS viewport bar ignores scrollbar CSS, so the reader scroller is `main.reader-scroll`.
    MuiCssBaseline: {
      styleOverrides: {
        // Drop the stable viewport gutter so it does not sit beside the reader bar.
        'html:has(main.reader-scroll)': {
          scrollbarGutter: 'auto',
        },
        'main.reader-scroll': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}`,
          '&::-webkit-scrollbar': {
            WebkitAppearance: 'none',
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: scrollbarTrack,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: scrollbarThumb,
            border: `1px solid ${scrollbarTrack}`,
            borderRadius: 8,
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: scrollbarThumbHover,
          },
          '&::-webkit-scrollbar-button': {
            display: 'none',
            width: 0,
            height: 0,
          },
        },
      },
    },
  },
});
