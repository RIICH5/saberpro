import prisma from "@/lib/prisma";
import { Prisma, Subject, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import SubjectListClientWrapper from "@/components/wrappers/SubjectListClientWrapper";

type SubjectWithTeachers = Subject & { teachers: Teacher[] };

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const ITEMS_PER_PAGE = 10;

  // URL PARAMS CONDITION
  const query: Prisma.SubjectWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // Fetch all subjects with teachers for client-side filtering and sorting
  const subjects = await prisma.subject.findMany({
    include: {
      teachers: true,
    },
  });

  // Get total count for pagination
  const count = await prisma.subject.count({ where: query });

  // Fetch all teachers for related data
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      surname: true,
    },
  });

  return (
    <div className="flex-1 m-4 mt-0">
      <SubjectListClientWrapper
        initialData={subjects as SubjectWithTeachers[] as any[]}
        userRole={role || undefined}
        count={count}
        teachers={teachers as any[]}
      />
    </div>
  );
};

export default SubjectListPage;
