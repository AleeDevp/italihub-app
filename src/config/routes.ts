import {
  Bell,
  ChartColumn,
  CirclePlus,
  HeartHandshake,
  Home as HomeIcon,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldUser,
  UserCheck,
  UserPen,
  type LucideIcon,
} from 'lucide-react';

export type AppRoute = {
  key: string;
  name: string;
  url: string;
  icon: LucideIcon;
  showInNav?: boolean;
  navOrder?: number;
  showInSidebar?: boolean; // if false, hide from sidebar; undefined means visible
  // Optional list of roles required to access this route (empty/undefined means open to all)
  requiresRole?: Array<'USER' | 'MODERATOR' | 'ADMIN'>;
  description: string;
  cta?: {
    label: string;
    href: string;
  };
};

export const ROUTE_DEFINITIONS = [
  // Non-dashboard root
  {
    key: 'home',
    name: 'Home',
    url: '/',
    icon: HomeIcon,
    showInNav: true,
    navOrder: 1,
    description: 'Discover the latest listings and updates from ItaliaHub.',
  },

  // Dashboard and sections
  {
    key: 'dashboard',
    name: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    showInNav: true,
    navOrder: 4,
    description: "Here's an overview of your ItaliaHub activity.",
  },
  {
    key: 'overview',
    name: 'Overview',
    url: '/dashboard/overview',
    icon: ChartColumn,
    description: 'Your ad performance and activity summary.',
  },
  {
    key: 'ads-management',
    name: 'Ads Management',
    url: '/dashboard/ads-management',
    icon: Newspaper,
    showInNav: true,
    navOrder: 3,
    description: 'Manage your ads and track their performance.',
  },
  {
    key: 'create-ad',
    name: 'Post Ad',
    url: '/dashboard/create-ad',
    icon: CirclePlus,
    showInNav: true,
    navOrder: 2,
    description: 'Create and publish a new listing on ItaliaHub.',
    cta: {
      label: 'Start Posting',
      href: '/dashboard/create-ad',
    },
  },
  {
    key: 'profile',
    name: 'Profile',
    url: '/dashboard/profile',
    icon: UserPen,
    description: 'Edit your profile information.',
  },
  {
    key: 'verification',
    name: 'Verification',
    url: '/dashboard/verification',
    icon: UserCheck,
    description:
      'Verify your identity to unlock all ItaliaHub features and build trust with other users.',
  },
  {
    key: 'settings',
    name: 'Security & Settings',
    url: '/dashboard/settings',
    icon: Settings,
    description: 'Manage your account preferences and security settings.',
  },
  {
    key: 'notifications',
    name: 'Notifications',
    url: '/dashboard/notifications',
    icon: Bell,
    showInNav: false,
    description: 'Stay updated with your ItaliaHub activity.',
  },
  {
    key: 'support',
    name: 'Support / Help',
    url: '/dashboard/support',
    icon: HeartHandshake,
    description: 'Get help with your account or report an issue.',
  },
  // Admin / Moderator panel (not shown in primary nav)
  {
    key: 'panel',
    name: 'Admin Panel',
    url: '/panel',
    icon: ShieldUser,
    requiresRole: ['MODERATOR', 'ADMIN'],
    description: 'Moderate content and manage users across ItaliaHub.',
  },
  // ensure trailing comma for future additions
] satisfies AppRoute[];

export type AppRouteKey = (typeof ROUTE_DEFINITIONS)[number]['key'];

const ROUTE_DEFINITION_MAP: Record<AppRouteKey, AppRoute> = ROUTE_DEFINITIONS.reduce(
  (acc, route) => {
    acc[route.key as AppRouteKey] = route;
    return acc;
  },
  {} as Record<AppRouteKey, AppRoute>
);

export function getRouteDefinition<K extends AppRouteKey>(key: K): AppRoute {
  return ROUTE_DEFINITION_MAP[key];
}
