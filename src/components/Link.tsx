"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconName, MenuItem } from "../../types/types";
import * as LucideIcons from "lucide-react";

interface PathLinkProps {
  item: MenuItem;
}

export default function PathLink({ item }: PathLinkProps) {
  const pathname = usePathname();

  // Extract base path without query parameters for comparison
  const basePath = pathname?.split("?")[0];

  // Check if the current path matches the item's href
  // This handles role-based routes and nested navigation
  const isActive =
    basePath === item.href ||
    (item.href !== "/" && basePath?.startsWith(item.href)) ||
    (item.href === "/" &&
      ["/admin", "/teacher", "/student", "/parent"].includes(basePath || ""));

  // Map of icon names to Lucide components
  const iconMap: Record<IconName, keyof typeof LucideIcons> = {
    home: "Home",
    users: "Users",
    userRound: "UserRound",
    users2: "Users2",
    bookOpen: "BookOpen",
    graduationCap: "GraduationCap",
    bookText: "BookText",
    fileSpreadsheet: "FileSpreadsheet",
    clipboardList: "ClipboardList",
    barChart2: "BarChart2",
    calendarCheck: "CalendarCheck",
    calendar: "Calendar",
    messageCircle: "MessageCircle",
    bell: "Bell",
    shapes: "Shapes",
    contact: "Contact",
  };

  // Get the correct icon component
  const IconComponent = LucideIcons[iconMap[item.icon]] as React.ElementType;

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-center lg:justify-start gap-4 text-slate-700 py-2 md:px-2 rounded-md hover:bg-slate-100 ${
        isActive ? "bg-slate-100" : ""
      }`}
    >
      <IconComponent size={20} />
      <span className="hidden lg:block">{item.label}</span>
    </Link>
  );
}
