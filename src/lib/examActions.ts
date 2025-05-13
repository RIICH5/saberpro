"use server";

import { ExamSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE EXAM ---
export const createExam = async (
  currentState: ActionState,
  data: ExamSchema
) => {
  try {
    // Verificar si la lección existe
    const lessonId =
      typeof data.lessonId === "string"
        ? parseInt(data.lessonId)
        : data.lessonId;
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teacher: true,
        class: true,
        subject: true,
      },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección seleccionada no existe.",
      };
    }

    // Convertir fechas
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Verificar que la duración no sea excesiva (más de 4 horas)
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 4) {
      return {
        success: false,
        error: true,
        message: "La duración del examen no debe exceder 4 horas.",
      };
    }

    // Verificar solapamiento con otros exámenes para la misma clase
    const classOverlap = await checkClassExamOverlap(
      lessonExists.classId,
      startTime,
      endTime,
      null
    );

    if (classOverlap) {
      return {
        success: false,
        error: true,
        message: `La clase ${lessonExists.class.name} ya tiene un examen programado en ese horario. Por favor, elija otro horario.`,
      };
    }

    // Crear el examen
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime,
        endTime,
        lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear el examen:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear el examen. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE EXAM ---
export const updateExam = async (
  currentState: ActionState,
  data: ExamSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de examen no proporcionado",
      };
    }

    // Verificar si el examen existe
    const examExists = await prisma.exam.findUnique({
      where: { id: data.id },
    });

    if (!examExists) {
      return {
        success: false,
        error: true,
        message: "El examen que intenta actualizar no existe.",
      };
    }

    // Verificar si la lección existe
    const lessonId =
      typeof data.lessonId === "string"
        ? parseInt(data.lessonId)
        : data.lessonId;
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teacher: true,
        class: true,
        subject: true,
      },
    });

    if (!lessonExists) {
      return {
        success: false,
        error: true,
        message: "La lección seleccionada no existe.",
      };
    }

    // Convertir fechas
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Verificar que la duración no sea excesiva (más de 4 horas)
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 4) {
      return {
        success: false,
        error: true,
        message: "La duración del examen no debe exceder 4 horas.",
      };
    }

    // Verificar solapamiento con otros exámenes para la misma clase (excluyendo el examen actual)
    const classOverlap = await checkClassExamOverlap(
      lessonExists.classId,
      startTime,
      endTime,
      data.id
    );

    if (classOverlap) {
      return {
        success: false,
        error: true,
        message: `La clase ${lessonExists.class.name} ya tiene un examen programado en ese horario. Por favor, elija otro horario.`,
      };
    }

    // Actualizar el examen
    await prisma.exam.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startTime,
        endTime,
        lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar el examen:", err);
    return {
      success: false,
      error: true,
      message: "Error al actualizar el examen. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE EXAM ---
export const deleteExam = async (currentState: ActionState, data: FormData) => {
  const id = data.get("id") as string;

  try {
    const examId = parseInt(id);

    // Verificar si el examen existe
    const examExists = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        results: true,
      },
    });

    if (!examExists) {
      return {
        success: false,
        error: true,
        message: "El examen que intenta eliminar no existe.",
      };
    }

    // Verificar si hay resultados relacionados
    if (examExists.results.length > 0) {
      return {
        success: false,
        error: true,
        message: `No se puede eliminar este examen porque tiene ${examExists.results.length} resultados asociados. Elimine los resultados primero.`,
      };
    }

    // Si no hay resultados relacionados, podemos eliminar el examen
    await prisma.exam.delete({
      where: { id: examId },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar el examen:", err);

    // Manejar específicamente el error de restricción de clave foránea
    if (err?.code === "P2003") {
      return {
        success: false,
        error: true,
        message:
          "No se puede eliminar este examen porque hay registros relacionados. Asegúrate de que no haya resultados u otros datos asociados a este examen.",
      };
    }

    return {
      success: false,
      error: true,
      message: "Error al eliminar el examen. Por favor, inténtalo de nuevo.",
    };
  }
};

// Helper function to check for time overlap for exams in a specific class
async function checkClassExamOverlap(
  classId: number,
  startTime: Date,
  endTime: Date,
  excludeExamId: number | null
) {
  const overlappingExams = await prisma.exam.findFirst({
    where: {
      id: excludeExamId ? { not: excludeExamId } : undefined,
      lesson: {
        classId: classId,
      },
      OR: [
        // Caso 1: El nuevo examen comienza durante otro examen existente
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // Caso 2: El nuevo examen termina durante otro examen existente
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // Caso 3: El nuevo examen contiene completamente a otro examen existente
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
    include: {
      lesson: {
        include: {
          class: true,
        },
      },
    },
  });

  return !!overlappingExams;
}
