import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3D5A80',
    },
    background: {
      default: '#fafafa',
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
    // Nav dropdowns must not hide the page scrollbar (Modal scroll lock).
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
  },
})
