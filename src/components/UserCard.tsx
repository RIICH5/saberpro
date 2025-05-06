import prisma from "@/lib/prisma";

const UserCard = async ({
  type,
  icon,
}: {
  type: "admin" | "teacher" | "student" | "parent";
  icon?: React.ReactNode;
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    teacher: prisma.teacher,
    student: prisma.student,
    parent: prisma.parent,
  };

  const data = await modelMap[type].count();

  // Spanish translation mapping for user types
  const typeTranslation: Record<typeof type, string> = {
    admin: "Administradores",
    teacher: "Profesores",
    student: "Estudiantes",
    parent: "Padres",
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-300 bg-white p-4 flex-1 min-w-[130px] shadow-sm`}
    >
      <div className="flex justify-between items-center -ml-1">{icon}</div>
      <h1 className="text-2xl font-semibold my-4 text-saberPro-dark">{data}</h1>
      <h2 className="text-sm font-medium text-saberPro-gray">
        {typeTranslation[type]}
      </h2>
    </div>
  );
};

export default UserCard;
