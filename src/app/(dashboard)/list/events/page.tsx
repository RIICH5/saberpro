import prisma from "@/lib/prisma";
import { Event, Prisma, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import EventListClientWrapper from "@/components/wrappers/EventListClientWrapper";

type EventWithRelations = Event & {
  class: Class | null;
};

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // Build Prisma query based on the user's role
  const query: Prisma.EventWhereInput = {};

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

  // Fetch all events with their relationships for client-side filtering and sorting
  const events = await prisma.event.findMany({
    where: query,
    include: {
      class: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  // Fetch classes for the event form
  // We need to filter classes based on the user's role
  let classQuery: Prisma.ClassWhereInput = {};

  if (role === "teacher") {
    // Teachers can only create events for their classes
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
      <EventListClientWrapper
        initialData={events as EventWithRelations[]}
        userRole={role || undefined}
        classes={classes}
      />
    </div>
  );
};

export default EventListPage;
