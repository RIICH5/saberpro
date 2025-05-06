import TeacherListClientWrapper from "@/components/wrappers/TeacherListWrapper";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const TeacherListPage = async () => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Fetch all teacher data in one go for client-side filtering and sorting
  const data = await prisma.teacher.findMany({
    include: {
      subjects: true,
      classes: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const subjects = await prisma.subject.findMany();

  const classes = await prisma.class.findMany();

  return (
    <div className="flex-1 m-4 mt-0">
      <TeacherListClientWrapper
        initialData={data as any[]}
        userRole={role || undefined}
        subjects={subjects as any[]}
        classes={classes as any[]}
      />
    </div>
  );
};

export default TeacherListPage;
