"use server";

import {
  AttendanceBulkSchema,
  AttendanceSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE ATTENDANCE ---
export const createAttendance = async (
  currentState: ActionState,
  data: AttendanceSchema
) => {
  try {
    // Verify if the student exists
    const studentExists = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!studentExists) {
      return {
        success: false,
        error: true,
        message: "El estudiante seleccionado no existe.",
      };
    }

    // Verify if the lesson exists
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección seleccionada no existe.",
      };
    }

    // Check if the student belongs to the class associated with the lesson
    const studentInClass = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        classId: lessonExists.classId,
      },
    });

    if (!studentInClass) {
      return {
        success: false,
        error: true,
        message: "El estudiante no pertenece a la clase de esta lección.",
      };
    }

    // Normalize date to the beginning of the day
    const attendanceDate = new Date(data.date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance record already exists for this student, lesson, and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: data.studentId,
        lessonId: data.lessonId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        error: true,
        message:
          "Ya existe un registro de asistencia para este estudiante, lección y fecha.",
      };
    }

    // Create the attendance record
    await prisma.attendance.create({
      data: {
        date: attendanceDate,
        present: data.present,
        studentId: data.studentId,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/attendances");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear la asistencia:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear la asistencia. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE ATTENDANCE ---
export const updateAttendance = async (
  currentState: ActionState,
  data: AttendanceSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de asistencia no proporcionado",
      };
    }

    // Verify if the attendance record exists
    const attendanceExists = await prisma.attendance.findUnique({
      where: { id: data.id },
    });

    if (!attendanceExists) {
      return {
        success: false,
        error: true,
        message: "El registro de asistencia que intenta actualizar no existe.",
      };
    }

    // Verify if the student exists
    const studentExists = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!studentExists) {
      return {
        success: false,
        error: true,
        message: "El estudiante seleccionado no existe.",
      };
    }

    // Verify if the lesson exists
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección seleccionada no existe.",
      };
    }

    // Check if the student belongs to the class associated with the lesson
    const studentInClass = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        classId: lessonExists.classId,
      },
    });

    if (!studentInClass) {
      return {
        success: false,
        error: true,
        message: "El estudiante no pertenece a la clase de esta lección.",
      };
    }

    // Normalize date to the beginning of the day
    const attendanceDate = new Date(data.date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if another attendance record exists for this student, lesson, and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: data.studentId,
        lessonId: data.lessonId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
        id: { not: data.id },
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        error: true,
        message:
          "Ya existe otro registro de asistencia para este estudiante, lección y fecha.",
      };
    }

    // Update the attendance record
    await prisma.attendance.update({
      where: { id: data.id },
      data: {
        date: attendanceDate,
        present: data.present,
        studentId: data.studentId,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/attendances");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar la asistencia:", err);
    return {
      success: false,
      error: true,
      message:
        "Error al actualizar la asistencia. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE ATTENDANCE ---
export const deleteAttendance = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const attendanceId = parseInt(id);

    // Verify if the attendance record exists
    const attendanceExists = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendanceExists) {
      return {
        success: false,
        error: true,
        message: "El registro de asistencia que intenta eliminar no existe.",
      };
    }

    // Delete the attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    revalidatePath("/list/attendances");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar la asistencia:", err);
    return {
      success: false,
      error: true,
      message:
        "Error al eliminar la asistencia. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- BULK CREATE ATTENDANCE ---
export const bulkCreateAttendance = async (
  currentState: ActionState,
  data: AttendanceBulkSchema
) => {
  try {
    // Verify if the lesson exists
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: {
        class: {
          include: {
            students: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección seleccionada no existe.",
      };
    }

    // Get the list of student IDs in the class
    const classStudentIds = lessonExists.class.students.map(
      (student) => student.id
    );

    // Normalize date to the beginning of the day
    const attendanceDate = new Date(data.date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check for existing attendance records for this lesson and date
    const existingAttendances = await prisma.attendance.findMany({
      where: {
        lessonId: data.lessonId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingAttendances.length > 0) {
      // Delete existing records first
      await prisma.attendance.deleteMany({
        where: {
          lessonId: data.lessonId,
          date: {
            gte: attendanceDate,
            lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });
    }

    // Validate that all students in the attendance data belong to the class
    for (const attendance of data.attendances) {
      if (!classStudentIds.includes(attendance.studentId)) {
        return {
          success: false,
          error: true,
          message: `El estudiante con ID ${attendance.studentId} no pertenece a la clase de esta lección.`,
        };
      }
    }

    // Create all attendance records
    await prisma.attendance.createMany({
      data: data.attendances.map((attendance) => ({
        date: attendanceDate,
        present: attendance.present,
        studentId: attendance.studentId,
        lessonId: data.lessonId,
      })),
    });

    revalidatePath("/list/attendances");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear asistencias en lote:", err);
    return {
      success: false,
      error: true,
      message:
        "Error al crear asistencias en lote. Por favor, inténtalo de nuevo.",
    };
  }
};
