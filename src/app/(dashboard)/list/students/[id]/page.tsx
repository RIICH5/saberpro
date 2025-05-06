import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Class, Student } from "@prisma/client";
import { UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const student:
    | (Student & {
        class: Class & { _count: { lessons: number } };
      })
    | null = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { include: { _count: { select: { lessons: true } } } },
    },
  });

  if (!student) {
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
              {student.img ? (
                <Image
                  src={student.img || "/noAvatar.png"}
                  alt=""
                  width={144}
                  height={144}
                  className="w-36 h-36 rounded-full object-cover"
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
                  {student.name + " " + student.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="student" type="update" data={student} />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-lg">🩸</span>
                    <strong>{student.bloodType}</strong>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-lg">🎂</span>
                    <span>
                      {new Intl.DateTimeFormat("es-MX").format(
                        student.birthday
                      )}
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-lg">📧</span>
                    <span>{student.email?.slice(0, 20).concat("...")}</span>
                  </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-lg">📞</span>
                    <span>
                      {student.phone
                        ? student.phone.replace(
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
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <Suspense fallback="loading...">
                <StudentAttendanceCard id={student.id} />
              </Suspense>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.class.name.charAt(0)}°
                </h1>
                <span className="text-sm text-gray-400">Grado</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.class._count.lessons}
                </h1>
                <span className="text-sm text-gray-400">Lecciones</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{student.class.name}</h1>
                <span className="text-sm text-gray-400">Clase</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
          <BigCalendarContainer type="classId" id={student.class.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/lessons?classId=${student.class.id}`}
            >
              Lecciones
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/exams?classId=${student.class.id}`}
            >
              Exámenes
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/assignments?classId=${student.class.id}`}
            >
              Tareas
            </Link>
            <Link
              className="p-3 rounded-md hover:underline bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
              href={`/list/results?studentId=${student.id}`}
            >
              Resultados
            </Link>
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
