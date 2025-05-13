import ParentListClientWrapper from "@/components/wrappers/ParentListClientWrapper";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type ParentList = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  img?: string;
  students: { id: string; name: string }[];
};

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Fetch all parents data for client-side filtering and sorting
  const data = await prisma.parent.findMany({
    include: {
      students: {
        select: { id: true, name: true, surname: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // We fetch the complete dataset for client-side operations
  // The pagination will happen on the client side

  // Fetch all students for the parent form
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
    },
  });

  return (
    <div className="flex-1 m-4 mt-0">
      <ParentListClientWrapper
        initialData={data as ParentList[]}
        userRole={role || undefined}
        students={students as any[]}
      />
    </div>
  );
};

export default ParentListPage;
