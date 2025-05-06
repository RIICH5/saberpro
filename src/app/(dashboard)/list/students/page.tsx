import StudentListClientWrapper from "@/components/wrappers/StudentListWrapper";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const StudentListPage = async () => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const data = await prisma.student.findMany({
    include: {
      class: true,
      grade: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const classes = await prisma.class.findMany();
  const grades = await prisma.grade.findMany();

  return (
    <div className="flex-1 m-4 mt-0">
      <StudentListClientWrapper
        initialData={data as any}
        userRole={role}
        classes={classes}
        grades={grades}
      />
    </div>
  );
};

export default StudentListPage;
