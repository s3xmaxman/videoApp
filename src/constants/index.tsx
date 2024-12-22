import {
  Bell,
  CreditCard,
  FileDuoToneBlack,
  Home,
  Settings,
} from "@/components/icons";

export const MENU_ITEMS = (
  workspaceId: string
): { title: string; href: string; icon: React.ReactNode }[] => [
  { title: "ホーム", href: `/dashboard/${workspaceId}/home`, icon: <Home /> },
  {
    title: "マイライブラリ",
    href: `/dashboard/${workspaceId}`,
    icon: <FileDuoToneBlack />,
  },
  {
    title: "通知",
    href: `/dashboard/${workspaceId}/notifications`,
    icon: <Bell />,
  },
  {
    title: "請求",
    href: `/dashboard/${workspaceId}/billing`,
    icon: <CreditCard />,
  },
  {
    title: "設定",
    href: `/dashboard/${workspaceId}/settings`,
    icon: <Settings />,
  },
];
