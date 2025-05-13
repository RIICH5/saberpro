import prisma from "@/lib/prisma";
import { Prisma, Result } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import ResultListClientWrapper from "@/components/wrappers/ResultListClientWrapper";

// Define the type with all the needed relations
type ResultWithRelations = Result & {
  student: {
    id: string;
    name: string;
    surname: string;
    class: {
      id: number;
      name: string;
    };
  };
  exam?: {
    id: number;
    title: string;
    startTime: Date;
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
  assignment?: {
    id: number;
    title: string;
    startDate: Date;
    dueDate: Date;
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
};

const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Build Prisma query based on the user's role
  const query: Prisma.ResultWhereInput = {};

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      // Admins can see all results
      break;
    case "teacher":
      // Teachers can only see results for their lessons
      query.OR = [
        { exam: { lesson: { teacherId: userId! } } },
        { assignment: { lesson: { teacherId: userId! } } },
      ];
      break;
    case "student":
      // Students can only see their own results
      query.studentId = userId!;
      break;
    case "parent":
      // Parents can only see results for their children
      query.student = {
        parentId: userId!,
      };
      break;
    default:
      break;
  }

  // Fetch all results with their relationships for client-side filtering and sorting
  const results = await prisma.result.findMany({
    where: query,
    include: {
      student: {
        include: {
          class: true,
        },
      },
      exam: {
        include: {
          lesson: {
            include: {
              subject: true,
              class: true,
              teacher: true,
            },
          },
        },
      },
      assignment: {
        include: {
          lesson: {
            include: {
              subject: true,
              class: true,
              teacher: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        student: {
          name: "asc",
        },
      },
    ],
  });

  // Fetch students for the result form based on role
  const studentQuery: Prisma.StudentWhereInput = {};

  if (role === "teacher") {
    // Teachers can only see students in their classes
    studentQuery.class = {
      supervisor: {
        id: userId!,
      },
    };
  } else if (role === "parent") {
    // Parents can only see their own children
    studentQuery.parentId = userId!;
  }

  const students = await prisma.student.findMany({
    where: studentQuery,
    include: {
      class: true,
    },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
  });

  // Fetch exams and assignments
  const examQuery: Prisma.ExamWhereInput = {};
  const assignmentQuery: Prisma.AssignmentWhereInput = {};

  if (role === "teacher") {
    // Teachers can only create results for their exams and assignments
    examQuery.lesson = {
      teacherId: userId!,
    };
    assignmentQuery.lesson = {
      teacherId: userId!,
    };
  }

  const exams = await prisma.exam.findMany({
    where: examQuery,
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
      startTime: "desc",
    },
  });

  const assignments = await prisma.assignment.findMany({
    where: assignmentQuery,
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
      dueDate: "desc",
    },
  });

  return (
    <div className="flex-1 m-4 mt-0">
      <ResultListClientWrapper
        initialData={results as any[]}
        userRole={role || undefined}
        students={students}
        exams={exams}
        assignments={assignments}
        userId={userId}
      />
    </div>
  );
};

export default ResultListPage;
