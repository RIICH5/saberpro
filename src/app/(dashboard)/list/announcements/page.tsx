import prisma from "@/lib/prisma";
import { Announcement, Prisma, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import AnnouncementListClientWrapper from "@/components/wrappers/AnnouncementListClientWrapper";

type AnnouncementWithRelations = Announcement & {
  class: Class | null;
};

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // Build Prisma query based on the user's role
  const query: Prisma.AnnouncementWhereInput = {};

  // ROLE CONDITIONS
  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };

  query.OR = [
    { classId: null },
    {
      class: roleConditions[role as keyof typeof roleConditions] || {},
    },
  ];

  // Fetch all announcements with their relationships for client-side filtering and sorting
  const announcements = await prisma.announcement.findMany({
    where: query,
    include: {
      class: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Fetch classes for the announcement form
  // We need to filter classes based on the user's role
  let classQuery: Prisma.ClassWhereInput = {};

  if (role === "teacher") {
    // Teachers can only create announcements for their classes
    classQuery = {
      supervisorId: currentUserId!,
    };
  }

  const classes = await prisma.class.findMany({
    where: classQuery,
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex-1 m-4 mt-0">
      <AnnouncementListClientWrapper
        initialData={announcements as AnnouncementWithRelations[]}
        userRole={role || undefined}
        classes={classes}
      />
    </div>
  );
};

export default AnnouncementListPage;
