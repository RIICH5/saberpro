import prisma from "@/lib/prisma";
import { Attendance, Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import AttendanceListClientWrapper from "@/components/wrappers/AttendanceClientWrapper";

// Define the type with all the needed relations
type AttendanceWithRelations = Attendance & {
  student: {
    id: string;
    name: string;
    surname: string;
    class: {
      id: number;
      name: string;
    };
  };
  lesson: {
    id: number;
    name: string;
    day: string;
    startTime: Date;
    endTime: Date;
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

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Build Prisma query based on the user's role
  const query: Prisma.AttendanceWhereInput = {};

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      // Admins can see all attendance records
      break;
    case "teacher":
      // Teachers can only see attendance records for their lessons
      query.lesson = {
        teacherId: userId!,
      };
      break;
    case "student":
      // Students can only see their own attendance records
      query.studentId = userId!;
      break;
    case "parent":
      // Parents can only see attendance records for their children
      query.student = {
        parentId: userId!,
      };
      break;
    default:
      break;
  }

  // Fetch all attendance records with their relationships for client-side filtering and sorting
  const attendances = await prisma.attendance.findMany({
    where: query,
    include: {
      student: {
        include: {
          class: true,
        },
      },
      lesson: {
        include: {
          subject: true,
          class: true,
          teacher: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        student: {
          name: "asc",
        },
      },
    ],
  });

  // Fetch lessons based on role for teacher's lessons
  const lessonQuery: Prisma.LessonWhereInput = {};

  if (role === "teacher") {
    // Teachers can only create attendance records for their lessons
    lessonQuery.teacherId = userId!;
  }

  // Get lessons with their students
  const lessons = await prisma.lesson.findMany({
    where: lessonQuery,
    include: {
      subject: true,
      class: {
        include: {
          students: {
            select: {
              id: true,
              name: true,
              surname: true,
              class: true,
            },
          },
        },
      },
      teacher: true,
    },
    orderBy: [{ subject: { name: "asc" } }, { name: "asc" }],
  });

  // Make sure students is included in lessons
  const processedLessons = lessons.map((lesson) => ({
    ...lesson,
    students: lesson.class.students,
  }));

  // Fetch students based on role
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

  return (
    <div className="flex-1 m-4 mt-0">
      <AttendanceListClientWrapper
        initialData={attendances as AttendanceWithRelations[]}
        userRole={role || undefined}
        lessons={processedLessons}
        students={students}
        userId={userId}
      />
    </div>
  );
};

export default AttendanceListPage;
