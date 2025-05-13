"use server";

import {
  EventSchema,
  eventSchemaWithValidation,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE EVENT ---
export const createEvent = async (
  currentState: ActionState,
  data: EventSchema
) => {
  try {
    // Validate with the enhanced schema
    const validationResult = eventSchemaWithValidation.safeParse(data);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message ||
        "Error de validación en los datos del evento.";

      return {
        success: false,
        error: true,
        message: errorMessage,
      };
    }

    // If classId is provided, verify that the class exists
    if (data.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classExists) {
        return {
          success: false,
          error: true,
          message: "La clase seleccionada no existe.",
        };
      }
    }

    // Create the event
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        classId: data.classId,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear el evento:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear el evento. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE EVENT ---
export const updateEvent = async (
  currentState: ActionState,
  data: EventSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de evento no proporcionado",
      };
    }

    // Validate with the enhanced schema
    const validationResult = eventSchemaWithValidation.safeParse(data);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message ||
        "Error de validación en los datos del evento.";

      return {
        success: false,
        error: true,
        message: errorMessage,
      };
    }

    // Verify if the event exists
    const eventExists = await prisma.event.findUnique({
      where: { id: data.id },
    });

    if (!eventExists) {
      return {
        success: false,
        error: true,
        message: "El evento que intenta actualizar no existe.",
      };
    }

    // If classId is provided, verify that the class exists
    if (data.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classExists) {
        return {
          success: false,
          error: true,
          message: "La clase seleccionada no existe.",
        };
      }
    }

    // Update the event
    await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        classId: data.classId,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar el evento:", err);
    return {
      success: false,
      error: true,
      message: "Error al actualizar el evento. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE EVENT ---
export const deleteEvent = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const eventId = parseInt(id);

    // Verify if the event exists
    const eventExists = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!eventExists) {
      return {
        success: false,
        error: true,
        message: "El evento que intenta eliminar no existe.",
      };
    }

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar el evento:", err);
    return {
      success: false,
      error: true,
      message: "Error al eliminar el evento. Por favor, inténtalo de nuevo.",
    };
  }
};
