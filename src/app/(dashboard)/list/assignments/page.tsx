import AssignmentListClientWrapper from "@/components/wrappers/AssignmentListClientWrapper";
import prisma from "@/lib/prisma";
import { Assignment, Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type AssignmentWithRelations = Assignment & {
  lesson: {
    id: number;
    name: string;
    subject: {
      id: number;
      name: string;
    };
    class: {
      id: number;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
      surname: string;
    };
  };
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Build Prisma query based on the user's role
  const query: Prisma.AssignmentWhereInput = {};

  query.lesson = {};

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      // Admins can see all assignments
      break;
    case "teacher":
      // Teachers can only see assignments for their lessons
      query.lesson.teacherId = userId!;
      break;
    case "student":
      // Students can only see assignments for their classes
      query.lesson.class = {
        students: {
          some: {
            id: userId!,
          },
        },
      };
      break;
    case "parent":
      // Parents can only see assignments for their children's classes
      query.lesson.class = {
        students: {
          some: {
            parentId: userId!,
          },
        },
      };
      break;
    default:
      break;
  }

  // Fetch all assignments with their relationships for client-side filtering and sorting
  const assignments = await prisma.assignment.findMany({
    where: query,
    include: {
      lesson: {
        include: {
          subject: true,
          class: true,
          teacher: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Fetch lessons for the assignment form
  // We need to filter lessons based on the user's role
  const lessonQuery: Prisma.LessonWhereInput = {};

  if (role === "teacher") {
    // Teachers can only create assignments for their own lessons
    lessonQuery.teacherId = userId!;
  }

  const lessons = await prisma.lesson.findMany({
    where: lessonQuery,
    include: {
      subject: true,
      class: true,
      teacher: true,
    },
    orderBy: [{ subject: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="flex-1 m-4 mt-0">
      <AssignmentListClientWrapper
        initialData={assignments as AssignmentWithRelations[]}
        userRole={role || undefined}
        lessons={lessons}
        userId={userId}
      />
    </div>
  );
};

export default AssignmentListPage;
