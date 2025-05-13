import ClassListClientWrapper from "@/components/wrappers/ClassListClientWrapper";
import prisma from "@/lib/prisma";
import { Class, Grade, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type ClassWithRelations = Class & {
  supervisor?: Teacher;
  grade?: Grade;
};

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Fetch all classes with their relationships for client-side filtering and sorting
  const classes = await prisma.class.findMany({
    include: {
      supervisor: true,
      grade: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch teachers for the class form
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
      surname: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch grades for the class form
  const grades = await prisma.grade.findMany({
    orderBy: {
      level: "asc",
    },
  });

  return (
    <div className="flex-1 m-4 mt-0">
      <ClassListClientWrapper
        initialData={classes as any[]}
        userRole={role || undefined}
        teachers={teachers}
        grades={grades}
      />
    </div>
  );
};

export default ClassListPage;
