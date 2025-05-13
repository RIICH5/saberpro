"use server";

import { AnnouncementSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE ANNOUNCEMENT ---
export const createAnnouncement = async (
  currentState: ActionState,
  data: AnnouncementSchema
) => {
  try {
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

    // Create the announcement
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        classId: data.classId,
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear el anuncio:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear el anuncio. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE ANNOUNCEMENT ---
export const updateAnnouncement = async (
  currentState: ActionState,
  data: AnnouncementSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de anuncio no proporcionado",
      };
    }

    // Verify if the announcement exists
    const announcementExists = await prisma.announcement.findUnique({
      where: { id: data.id },
    });

    if (!announcementExists) {
      return {
        success: false,
        error: true,
        message: "El anuncio que intenta actualizar no existe.",
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

    // Update the announcement
    await prisma.announcement.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        classId: data.classId,
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar el anuncio:", err);
    return {
      success: false,
      error: true,
      message: "Error al actualizar el anuncio. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE ANNOUNCEMENT ---
export const deleteAnnouncement = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const announcementId = parseInt(id);

    // Verify if the announcement exists
    const announcementExists = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcementExists) {
      return {
        success: false,
        error: true,
        message: "El anuncio que intenta eliminar no existe.",
      };
    }

    // Delete the announcement
    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar el anuncio:", err);
    return {
      success: false,
      error: true,
      message: "Error al eliminar el anuncio. Por favor, inténtalo de nuevo.",
    };
  }
};
