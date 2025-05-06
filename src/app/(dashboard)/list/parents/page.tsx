import ParentListClientWrapper from "@/components/wrappers/ParentListClientWrapper";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type ParentList = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  img?: string;
  students: { id: string; name: string }[];
};

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build Prisma query from search params
  const query: Prisma.ParentWhereInput = {};
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

  // Fetch paginated parents and total count
  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: {
          select: { id: true, name: true },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.parent.count({ where: query }),
  ]);

  return (
    <div className="flex-1 m-4 mt-0">
      <ParentListClientWrapper
        initialData={data as ParentList[]}
        userRole={role}
      />
    </div>
  );
};

export default ParentListPage;
