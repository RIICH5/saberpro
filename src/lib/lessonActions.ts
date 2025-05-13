"use server";

import { LessonSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE LESSON ---
export const createLesson = async (
  currentState: ActionState,
  data: LessonSchema
) => {
  try {
    // Verificar si la clase existe
    const classExists = await prisma.class.findUnique({
      where: { id: Number(data.classId) },
    });

    if (!classExists) {
      return {
        success: false,
        error: true,
        message: "La clase seleccionada no existe.",
      };
    }

    // Verificar si la asignatura existe
    const subjectExists = await prisma.subject.findUnique({
      where: { id: Number(data.subjectId) },
    });

    if (!subjectExists) {
      return {
        success: false,
        error: true,
        message: "La asignatura seleccionada no existe.",
      };
    }

    // Verificar si el profesor existe
    const teacherExists = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacherExists) {
      return {
        success: false,
        error: true,
        message: "El profesor seleccionado no existe.",
      };
    }

    // Verificar solapamiento de horarios para la clase
    const classOverlap = await checkClassTimeOverlap(
      Number(data.classId),
      data.day,
      new Date(data.startTime),
      new Date(data.endTime),
      null
    );

    if (classOverlap) {
      return {
        success: false,
        error: true,
        message: `La clase ${classExists.name} ya tiene una lección programada en ese horario. Por favor, elija otro horario.`,
      };
    }

    // Verificar solapamiento de horarios para el profesor
    const teacherOverlap = await checkTeacherTimeOverlap(
      data.teacherId,
      data.day,
      new Date(data.startTime),
      new Date(data.endTime),
      null
    );

    if (teacherOverlap) {
      return {
        success: false,
        error: true,
        message: `El profesor ${teacherExists.name} ya tiene una lección programada en ese horario. Por favor, elija otro horario o profesor.`,
      };
    }

    // Crear la lección
    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        subjectId: Number(data.subjectId),
        classId: Number(data.classId),
        teacherId: data.teacherId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear la lección:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear la lección. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE LESSON ---
export const updateLesson = async (
  currentState: ActionState,
  data: LessonSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de lección no proporcionado",
      };
    }

    // Verificar si la lección existe
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: data.id },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección que intenta actualizar no existe.",
      };
    }

    // Verificar si la clase existe
    const classExists = await prisma.class.findUnique({
      where: { id: Number(data.classId) },
    });

    if (!classExists) {
      return {
        success: false,
        error: true,
        message: "La clase seleccionada no existe.",
      };
    }

    // Verificar si la asignatura existe
    const subjectExists = await prisma.subject.findUnique({
      where: { id: Number(data.subjectId) },
    });

    if (!subjectExists) {
      return {
        success: false,
        error: true,
        message: "La asignatura seleccionada no existe.",
      };
    }

    // Verificar si el profesor existe
    const teacherExists = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacherExists) {
      return {
        success: false,
        error: true,
        message: "El profesor seleccionado no existe.",
      };
    }

    // Verificar solapamiento de horarios para la clase (excluyendo la lección actual)
    const classOverlap = await checkClassTimeOverlap(
      Number(data.classId),
      data.day,
      new Date(data.startTime),
      new Date(data.endTime),
      data.id
    );

    if (classOverlap) {
      return {
        success: false,
        error: true,
        message: `La clase ${classExists.name} ya tiene una lección programada en ese horario. Por favor, elija otro horario.`,
      };
    }

    // Verificar solapamiento de horarios para el profesor (excluyendo la lección actual)
    const teacherOverlap = await checkTeacherTimeOverlap(
      data.teacherId,
      data.day,
      new Date(data.startTime),
      new Date(data.endTime),
      data.id
    );

    if (teacherOverlap) {
      return {
        success: false,
        error: true,
        message: `El profesor ${teacherExists.name} ya tiene una lección programada en ese horario. Por favor, elija otro horario o profesor.`,
      };
    }

    // Actualizar la lección
    await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: data.name,
        day: data.day,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        subjectId: Number(data.subjectId),
        classId: Number(data.classId),
        teacherId: data.teacherId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar la lección:", err);
    return {
      success: false,
      error: true,
      message: "Error al actualizar la lección. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE LESSON ---
export const deleteLesson = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const lessonId = parseInt(id);

    // Verificar si la lección existe
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        exams: true,
        assignments: true,
        attendances: true,
      },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección que intenta eliminar no existe.",
      };
    }

    // Verificar si hay examenes, tareas o asistencias relacionadas
    if (lessonExists.exams.length > 0) {
      return {
        success: false,
        error: true,
        message: `No se puede eliminar esta lección porque tiene ${lessonExists.exams.length} exámenes asociados. Elimine los exámenes primero.`,
      };
    }

    if (lessonExists.assignments.length > 0) {
      return {
        success: false,
        error: true,
        message: `No se puede eliminar esta lección porque tiene ${lessonExists.assignments.length} tareas asociadas. Elimine las tareas primero.`,
      };
    }

    if (lessonExists.attendances.length > 0) {
      return {
        success: false,
        error: true,
        message: `No se puede eliminar esta lección porque tiene ${lessonExists.attendances.length} registros de asistencia asociados. Elimine los registros de asistencia primero.`,
      };
    }

    // Si no hay registros relacionados, podemos eliminar la lección
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar la lección:", err);

    // Manejar específicamente el error de restricción de clave foránea
    if (err?.code === "P2003") {
      return {
        success: false,
        error: true,
        message:
          "No se puede eliminar esta lección porque hay registros relacionados. Asegúrate de que no haya exámenes, tareas u otros datos asociados a esta lección.",
      };
    }

    return {
      success: false,
      error: true,
      message: "Error al eliminar la lección. Por favor, inténtalo de nuevo.",
    };
  }
};

// Helper function to check for time overlap for a specific class
async function checkClassTimeOverlap(
  classId: number,
  day: string,
  startTime: Date,
  endTime: Date,
  excludeLessonId: number | null
) {
  const overlappingLessons = await prisma.lesson.findFirst({
    where: {
      classId: classId,
      day: day as any,
      id: excludeLessonId ? { not: excludeLessonId } : undefined,
      OR: [
        // Caso 1: La nueva lección comienza durante otra lección existente
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // Caso 2: La nueva lección termina durante otra lección existente
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // Caso 3: La nueva lección contiene completamente a otra lección existente
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  });

  return !!overlappingLessons;
}

// Helper function to check for time overlap for a specific teacher
async function checkTeacherTimeOverlap(
  teacherId: string,
  day: string,
  startTime: Date,
  endTime: Date,
  excludeLessonId: number | null
) {
  const overlappingLessons = await prisma.lesson.findFirst({
    where: {
      teacherId: teacherId,
      day: day as any,
      id: excludeLessonId ? { not: excludeLessonId } : undefined,
      OR: [
        // Caso 1: La nueva lección comienza durante otra lección existente
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // Caso 2: La nueva lección termina durante otra lección existente
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // Caso 3: La nueva lección contiene completamente a otra lección existente
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  });

  return !!overlappingLessons;
}
