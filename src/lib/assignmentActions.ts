"use server";

import { AssignmentSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE ASSIGNMENT ---
export const createAssignment = async (
  currentState: ActionState,
  data: AssignmentSchema
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
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);

    // Verificar que haya un plazo razonable para la tarea (al menos 1 día)
    const durationDays =
      (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays < 1) {
      return {
        success: false,
        error: true,
        message:
          "Debe haber al menos 1 día entre la fecha de inicio y la fecha de entrega.",
      };
    }

    // Verificar que la fecha de entrega no esté demasiado lejos (máximo 30 días)
    if (durationDays > 30) {
      return {
        success: false,
        error: true,
        message:
          "La fecha de entrega no debe exceder 30 días desde la fecha de inicio.",
      };
    }

    // Crear la asignación
    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate,
        dueDate,
        lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear la tarea:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear la tarea. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE ASSIGNMENT ---
export const updateAssignment = async (
  currentState: ActionState,
  data: AssignmentSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de tarea no proporcionado",
      };
    }

    // Verificar si la asignación existe
    const assignmentExists = await prisma.assignment.findUnique({
      where: { id: data.id },
    });

    if (!assignmentExists) {
      return {
        success: false,
        error: true,
        message: "La tarea que intenta actualizar no existe.",
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
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);

    // Verificar que haya un plazo razonable para la tarea (al menos 1 día)
    const durationDays =
      (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays < 1) {
      return {
        success: false,
        error: true,
        message:
          "Debe haber al menos 1 día entre la fecha de inicio y la fecha de entrega.",
      };
    }

    // Verificar que la fecha de entrega no esté demasiado lejos (máximo 30 días)
    if (durationDays > 30) {
      return {
        success: false,
        error: true,
        message:
          "La fecha de entrega no debe exceder 30 días desde la fecha de inicio.",
      };
    }

    // Actualizar la asignación
    await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startDate,
        dueDate,
        lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar la tarea:", err);
    return {
      success: false,
      error: true,
      message: "Error al actualizar la tarea. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE ASSIGNMENT ---
export const deleteAssignment = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const assignmentId = parseInt(id);

    // Verificar si la asignación existe
    const assignmentExists = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        results: true,
      },
    });

    if (!assignmentExists) {
      return {
        success: false,
        error: true,
        message: "La tarea que intenta eliminar no existe.",
      };
    }

    // Verificar si hay calificaciones relacionados
    if (assignmentExists.results.length > 0) {
      return {
        success: false,
        error: true,
        message: `No se puede eliminar esta tarea porque tiene ${assignmentExists.results.length} calificaciones asociados. Elimine los calificaciones primero.`,
      };
    }

    // Si no hay calificaciones relacionados, podemos eliminar la asignación
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar la tarea:", err);

    // Manejar específicamente el error de restricción de clave foránea
    if (err?.code === "P2003") {
      return {
        success: false,
        error: true,
        message:
          "No se puede eliminar esta tarea porque hay registros relacionados. Asegúrate de que no haya calificaciones u otros datos asociados a esta tarea.",
      };
    }

    return {
      success: false,
      error: true,
      message: "Error al eliminar la tarea. Por favor, inténtalo de nuevo.",
    };
  }
};
