import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Teacher } from "@prisma/client";
import { UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher:
    | (Teacher & {
        _count: { subjects: number; lessons: number; classes: number };
      })
    | null = await prisma.teacher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              {teacher.img ? (
                <Image
                  src={teacher.img || "/noAvatar.png"}
                  alt=""
                  width={144}
                  height={144}
                  className="w-52 h-52 rounded-full object-cover flex items-center justify-center ml-4"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center rounded-full">
                  <UserRound size={100} />
                </div>
              )}
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-lg font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-2xl">🩸</span>
                    <strong>{teacher.bloodType}</strong>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-2xl">🎂</span>
                    <span>
                      {new Intl.DateTimeFormat("es-MX").format(
                        teacher.birthday
                      )}
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-2xl">📧</span>
                    <span>{teacher.email?.slice(0, 20).concat("...")}</span>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-2xl">📞</span>
                    <span>
                      {teacher.phone
                        ? teacher.phone.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "$1-$2-$3"
                          )
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <p className="flex items-center gap-x-4">
            <span className="text-2xl font-semibold gap-4">Agenda</span>
          </p>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Atajos</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/classes?supervisorId=${teacher.id}`}
            >
              Clases
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              Estudiantes
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              Lecciones
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/exams?teacherId=${teacher.id}`}
            >
              Exámenes
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/assignments?teacherId=${teacher.id}`}
            >
              Tareas
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
