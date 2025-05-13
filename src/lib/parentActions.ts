"use server";

import { clerkClient } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { localizeClerkError } from "../../hooks/errorHandling";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// --- CREATE PARENT ---
export const createParent = async (
  currentState: ActionState,
  formData: FormData
) => {
  try {
    // Extract basic data
    const name = formData.get("name") as string;
    const surname = formData.get("surname") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Get students as array
    const students = formData
      .getAll("students[]")
      .map((studentId) => studentId.toString());

    // Validate required fields
    if (!name || !surname) {
      return {
        success: false,
        error: true,
        message: "Nombre y apellido son campos obligatorios",
      };
    }

    if (!/^\d{6}$/.test(username)) {
      return {
        success: false,
        error: true,
        prismaErrors: [
          {
            code: "validation_error",
            field: "username",
            message:
              "El número de cuenta debe tener exactamente 6 dígitos numéricos.",
          },
        ],
      };
    }

    // Check if a teacher with this username already exists
    const existingParentUsername = await prisma.parent.findUnique({
      where: { username },
    });

    if (existingParentUsername) {
      return {
        success: false,
        error: true,
        prismaErrors: [
          {
            code: "unique_constraint",
            field: "username",
            message:
              "Este número de cuenta ya está en uso. Por favor, utiliza otro número.",
          },
        ],
      };
    }

    // Check if a parent  with this phone already exists
    if (phone) {
      const existingParentPhone = await prisma.teacher.findFirst({
        where: { phone },
      });

      if (existingParentPhone) {
        return {
          success: false,
          error: true,
          prismaErrors: [
            {
              code: "unique_constraint",
              field: "phone",
              message:
                "Este número de teléfono ya está en uso. Por favor, utiliza otro número.",
            },
          ],
        };
      }
    }

    // Create a Clerk user with the properly formatted username
    // Clerk only allows alphanumeric, dash, and underscore in usernames
    const clerkUsername = `parent_${username}`;

    // Check if password meets Clerk requirements
    if (!validatePassword(password)) {
      return {
        success: false,
        error: true,
        clerkErrors: [
          {
            code: "form_password_requirements",
            message: "La contraseña no cumple con los requisitos de seguridad",
            longMessage:
              "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número",
          },
        ],
      };
    }

    // Create Clerk user
    let user;
    try {
      user = await clerkClient.users.createUser({
        username: clerkUsername,
        password: password,
        firstName: name,
        lastName: surname,
        publicMetadata: { role: "teacher" },
      });
    } catch (err: any) {
      console.error("Clerk user creation error:", err);

      // Map Clerk errors to more user-friendly messages in Spanish
      if (err && typeof err === "object" && "errors" in err) {
        return {
          success: false,
          error: true,
          clerkErrors: err.errors.map((error: any) => ({
            ...error,
            message: localizeClerkError(error.code, error.message),
          })),
        };
      }

      throw err;
    }

    // Create parent in database
    await prisma.parent.create({
      data: {
        // Generate a UUID for the id field
        id: user.id,
        name,
        surname,
        username,
        email: email || null,
        phone: phone?.replace(/\D/g, "") || "", // Remove non-digits from phone number
        address,
        students: {
          connect: students.map((studentId: string) => ({
            id: studentId,
          })),
        },
      },
    });
    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating parent:", err);

    // Handle Prisma errors - specifically unique constraint violations
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      if (err.meta && err.meta.target && Array.isArray(err.meta.target)) {
        if (err.meta.target.includes("email")) {
          return {
            success: false,
            error: true,
            message:
              "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
          };
        }
        if (err.meta.target.includes("phone")) {
          return {
            success: false,
            error: true,
            message:
              "Este número de teléfono ya está en uso. Por favor, utiliza otro número.",
          };
        }
      }
    }

    return { success: false, error: true };
  }
};

// --- UPDATE PARENT ---
export const updateParent = async (
  currentState: ActionState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: true, message: "ID no proporcionado" };
    }

    // Extract basic data
    const name = formData.get("name") as string;
    const surname = formData.get("surname") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Get students as array
    const students = formData
      .getAll("students[]")
      .map((studentId) => studentId.toString());

    // Validate required fields
    if (!name || !surname) {
      return {
        success: false,
        error: true,
        message: "Nombre y apellido son campos obligatorios",
      };
    }

    // Check for duplicate email (excluding current parent)
    if (email) {
      const existingParentEmail = await prisma.parent.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (existingParentEmail) {
        return {
          success: false,
          error: true,
          message:
            "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
        };
      }
    }

    // Check for duplicate phone (excluding current parent)
    if (phone) {
      const cleanedPhone = phone.replace(/\D/g, "");
      const existingParentPhone = await prisma.parent.findFirst({
        where: {
          phone: cleanedPhone,
          NOT: { id },
        },
      });

      if (existingParentPhone) {
        return {
          success: false,
          error: true,
          message:
            "Este número de teléfono ya está en uso. Por favor, utiliza otro número.",
        };
      }
    }

    // Check if a parent with this username already exists
    const existingParentUsername = await prisma.parent.findUnique({
      where: { username: id },
    });

    if (!existingParentUsername) {
      return {
        success: false,
        error: true,
        message:
          "No se encontró un padre con este número de cuenta. Por favor, verifica el número.",
      };
    }

    if (password && !validatePassword(password)) {
      return {
        success: false,
        error: true,
        clerkErrors: [
          {
            code: "form_password_requirements",
            message: "La contraseña no cumple con los requisitos de seguridad",
            longMessage:
              "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número",
          },
        ],
      };
    }

    const clerkUsername = `teacher_${username}`;

    // Update Clerk user
    let user;
    try {
      await clerkClient.users.updateUser(id, {
        username: clerkUsername,
        ...(password ? { password } : {}),
        firstName: name,
        lastName: surname,
      });
    } catch (err: any) {
      console.error("Clerk user update error:", err);

      // Map Clerk errors to more user-friendly messages in Spanish
      if (err && typeof err === "object" && "errors" in err) {
        return {
          success: false,
          error: true,
          clerkErrors: err.errors.map((error: any) => ({
            ...error,
            message: localizeClerkError(error.code, error.message),
          })),
        };
      }

      throw err;
    }

    // Update parent in database
    await prisma.parent.update({
      where: { id },
      data: {
        name,
        surname,
        username,
        email: email || null,
        phone: phone?.replace(/\D/g, "") || undefined, // Remove non-digits from phone number
        address,
        students: {
          set: students.map((studentId: string) => ({
            id: studentId,
          })),
        },
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating parent:", err);

    // Handle Prisma errors
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      if (err.meta && err.meta.target && Array.isArray(err.meta.target)) {
        if (err.meta.target.includes("email")) {
          return {
            success: false,
            error: true,
            message:
              "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
          };
        }
        if (err.meta.target.includes("phone")) {
          return {
            success: false,
            error: true,
            message:
              "Este número de teléfono ya está en uso. Por favor, utiliza otro número.",
          };
        }
      }
    }

    return { success: false, error: true };
  }
};

// --- DELETE PARENT ---
export const deleteParent = async (
  currentState: ActionState,
  formData: FormData
) => {
  const id = formData.get("id") as string;

  try {
    // Delete from database
    await prisma.parent.delete({
      where: { id },
    });

    // Delete from Clerk
    await clerkClient.users.deleteUser(id);

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error in deleteParent action:", err);
    return { success: false, error: true };
  }
};

function validatePassword(password: string): boolean {
  // Check if password exists
  if (!password) return false;

  // Password must be at least 8 characters
  if (password.length < 8) return false;

  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;

  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;

  // Password must contain at least one number
  if (!/[0-9]/.test(password)) return false;

  return true;
}
