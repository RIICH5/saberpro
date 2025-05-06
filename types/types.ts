// User role types
export type UserRole = "admin" | "teacher" | "student" | "parent";

// Define possible icon names
export type IconName =
  | "home"
  | "users"
  | "userRound"
  | "users2"
  | "bookOpen"
  | "graduationCap"
  | "bookText"
  | "fileSpreadsheet"
  | "clipboardList"
  | "barChart2"
  | "calendarCheck"
  | "calendar"
  | "messageCircle"
  | "contact"
  | "shapes"
  | "bell";

// MenuItem interface
export interface MenuItem {
  icon: IconName;
  label: string;
  href: string;
  visible: UserRole[];
}

// Menu section interface
export interface MenuSection {
  title: string;
  items: MenuItem[];
}
