import LessonListClientWrapper from "@/components/wrappers/LessonListClientWrapper";
import prisma from "@/lib/prisma";
import { Lesson, Subject, Class, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type LessonWithRelations = Lesson & {
  subject: Subject;
  class: Class;
  teacher: Teacher;
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Fetch all lessons with their relationships for client-side filtering and sorting
  const lessons = await prisma.lesson.findMany({
    include: {
      subject: true,
      class: true,
      teacher: true,
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  // Fetch subjects for the lesson form
  const subjects = await prisma.subject.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Fetch classes for the lesson form
  const classes = await prisma.class.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Fetch teachers for the lesson form
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

  return (
    <div className="flex-1 m-4 mt-0">
      <LessonListClientWrapper
        initialData={lessons as LessonWithRelations[]}
        userRole={role || undefined}
        subjects={subjects}
        classes={classes}
        teachers={teachers}
      />
    </div>
  );
};

export default LessonListPage;
