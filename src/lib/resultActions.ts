"use server";

import { ResultSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE RESULT ---
export const createResult = async (
  currentState: ActionState,
  data: ResultSchema
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

    // Determine assessment type and verify existence
    let examId = undefined;
    let assignmentId = undefined;
    const assessmentId =
      typeof data.assessmentId === "string"
        ? parseInt(data.assessmentId)
        : data.assessmentId;

    if (data.assessmentType === "exam") {
      const examExists = await prisma.exam.findUnique({
        where: { id: assessmentId },
      });

      if (!examExists) {
        return {
          success: false,
          error: true,
          message: "El examen seleccionado no existe.",
        };
      }

      // Verify if a result already exists for this student and exam
      const existingResult = await prisma.result.findFirst({
        where: {
          studentId: data.studentId,
          examId: assessmentId,
        },
      });

      if (existingResult) {
        return {
          success: false,
          error: true,
          message: "Ya existe un resultado para este estudiante y examen.",
        };
      }

      examId = assessmentId;
    } else if (data.assessmentType === "assignment") {
      const assignmentExists = await prisma.assignment.findUnique({
        where: { id: assessmentId },
      });

      if (!assignmentExists) {
        return {
          success: false,
          error: true,
          message: "La tarea seleccionada no existe.",
        };
      }

      // Verify if a result already exists for this student and assignment
      const existingResult = await prisma.result.findFirst({
        where: {
          studentId: data.studentId,
          assignmentId: assessmentId,
        },
      });

      if (existingResult) {
        return {
          success: false,
          error: true,
          message: "Ya existe un resultado para este estudiante y tarea.",
        };
      }

      assignmentId = assessmentId;
    } else {
      return {
        success: false,
        error: true,
        message: "Debe seleccionar un tipo de evaluación válido.",
      };
    }

    // Create the result
    await prisma.result.create({
      data: {
        score: data.score,
        studentId: data.studentId,
        examId,
        assignmentId,
      },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear el resultado:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear el resultado. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE RESULT ---
export const updateResult = async (
  currentState: ActionState,
  data: ResultSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de resultado no proporcionado",
      };
    }

    // Verify if the result exists
    const resultExists = await prisma.result.findUnique({
      where: { id: data.id },
    });

    if (!resultExists) {
      return {
        success: false,
        error: true,
        message: "El resultado que intenta actualizar no existe.",
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

    // Determine assessment type and verify existence
    let examId = undefined;
    let assignmentId = undefined;
    const assessmentId =
      typeof data.assessmentId === "string"
        ? parseInt(data.assessmentId)
        : data.assessmentId;

    if (data.assessmentType === "exam") {
      const examExists = await prisma.exam.findUnique({
        where: { id: assessmentId },
      });

      if (!examExists) {
        return {
          success: false,
          error: true,
          message: "El examen seleccionado no existe.",
        };
      }

      // Verify if another result already exists for this student and exam
      const existingResult = await prisma.result.findFirst({
        where: {
          studentId: data.studentId,
          examId: assessmentId,
          id: { not: data.id },
        },
      });

      if (existingResult) {
        return {
          success: false,
          error: true,
          message: "Ya existe otro resultado para este estudiante y examen.",
        };
      }

      examId = assessmentId;
    } else if (data.assessmentType === "assignment") {
      const assignmentExists = await prisma.assignment.findUnique({
        where: { id: assessmentId },
      });

      if (!assignmentExists) {
        return {
          success: false,
          error: true,
          message: "La tarea seleccionada no existe.",
        };
      }

      // Verify if another result already exists for this student and assignment
      const existingResult = await prisma.result.findFirst({
        where: {
          studentId: data.studentId,
          assignmentId: assessmentId,
          id: { not: data.id },
        },
      });

      if (existingResult) {
        return {
          success: false,
          error: true,
          message: "Ya existe otro resultado para este estudiante y tarea.",
        };
      }

      assignmentId = assessmentId;
    } else {
      return {
        success: false,
        error: true,
        message: "Debe seleccionar un tipo de evaluación válido.",
      };
    }

    // Update the result
    await prisma.result.update({
      where: { id: data.id },
      data: {
        score: data.score,
        studentId: data.studentId,
        examId,
        assignmentId,
      },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar el resultado:", err);
    return {
      success: false,
      error: true,
      message:
        "Error al actualizar el resultado. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE RESULT ---
export const deleteResult = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const resultId = parseInt(id);

    // Verify if the result exists
    const resultExists = await prisma.result.findUnique({
      where: { id: resultId },
    });

    if (!resultExists) {
      return {
        success: false,
        error: true,
        message: "El resultado que intenta eliminar no existe.",
      };
    }

    // Delete the result
    await prisma.result.delete({
      where: { id: resultId },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar el resultado:", err);
    return {
      success: false,
      error: true,
      message: "Error al eliminar el resultado. Por favor, inténtalo de nuevo.",
    };
  }
};
