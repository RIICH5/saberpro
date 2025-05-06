import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

const localizedRoles = {
  student: "Estudiante",
  parent: "Padre",
  teacher: "Profesor",
  admin: "Admin",
};

const Navbar = async () => {
  const user = await currentUser();
  // Explicitly type publicMetadata for role
  const role = (
    user?.publicMetadata as { role?: keyof typeof localizedRoles } | undefined
  )?.role;
  return (
    <div className="flex items-center justify-between p-4">
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">
            {user?.fullName || user?.username}
          </span>
          <span className="text-[10px] text-gray-500 text-right">
            {role ? ` ${localizedRoles[role]}` : null}
          </span>
        </div>
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;
