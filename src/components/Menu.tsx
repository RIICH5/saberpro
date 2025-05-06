import { currentUser } from "@clerk/nextjs/server";
import { MenuSection, UserRole, IconName } from "../../types/types";
import PathLink from "./Link";

const Menu = async () => {
  const user = await currentUser();
  const role = (user?.publicMetadata.role as UserRole) || "student"; // Default to student if no role found

  const menuItems: MenuSection[] = [
    {
      title: "MENÚ",
      items: [
        {
          icon: "home",
          label: "Inicio",
          href:
            role === "admin"
              ? "/admin"
              : role === "teacher"
              ? "/teacher"
              : role === "parent"
              ? "/parent"
              : "/student",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "graduationCap",
          label: "Profesores",
          href: "/list/teachers",
          visible: ["admin", "teacher"],
        },
        {
          icon: "userRound",
          label: "Estudiantes",
          href: "/list/students",
          visible: ["admin", "teacher"],
        },
        {
          icon: "contact",
          label: "Padres",
          href: "/list/parents",
          visible: ["admin", "teacher"],
        },
        {
          icon: "bookOpen",
          label: "Asignaturas",
          href: "/list/subjects",
          visible: ["admin"],
        },
        {
          icon: "shapes",
          label: "Clases",
          href: "/list/classes",
          visible: ["admin", "teacher"],
        },
        {
          icon: "bookText",
          label: "Lecciones",
          href: "/list/lessons",
          visible: ["admin", "teacher"],
        },
        {
          icon: "fileSpreadsheet",
          label: "Exámenes",
          href: "/list/exams",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "clipboardList",
          label: "Tareas",
          href: "/list/assignments",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "barChart2",
          label: "Resultados",
          href: "/list/results",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "calendarCheck",
          label: "Asistencia",
          href: "/list/attendance",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "calendar",
          label: "Eventos",
          href: "/list/events",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "bell",
          label: "Anuncios",
          href: "/list/announcements",
          visible: ["admin", "teacher", "student", "parent"],
        },
      ],
    },
  ];

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          {section.items
            .filter((item) => item.visible.includes(role))
            .map((item) => (
              <PathLink key={item.href} item={item} />
            ))}
        </div>
      ))}
    </div>
  );
};

export default Menu;
