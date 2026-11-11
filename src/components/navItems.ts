import type { SvgIconComponent } from '@mui/icons-material';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export type NavItem = {
  labelKey: string;
  to: '/books' | '/logs' | '/settings' | '/config-guide' | '/about';
  Icon: SvgIconComponent;
};

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.books', to: '/books', Icon: AutoStoriesOutlinedIcon },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.logs', to: '/logs', Icon: NotesOutlinedIcon },
  { labelKey: 'nav.settings', to: '/settings', Icon: SettingsOutlinedIcon },
  { labelKey: 'nav.configGuide', to: '/config-guide', Icon: DescriptionOutlinedIcon },
  { labelKey: 'nav.about', to: '/about', Icon: InfoOutlinedIcon },
];
