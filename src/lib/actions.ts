"use server";

import {
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./validation";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ClassSchema } from "./formValidationSchemas";

// Define the state type that matches what we return from our actions
type ActionState = {
  success: boolean;
  error: boolean;
  clerkErrors?: any[] | null;
};

export const createSubject = async (
  currentState: ActionState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers?.map(
            (teacherId) => ({ id: teacherId.toString() } as any)
          ),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: ActionState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers?.map(
            (teacherId) => ({ id: teacherId.toString() } as any)
          ),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// --- CREATE CLASS ---
export const createClass = async (
  currentState: ActionState,
  data: ClassSchema
) => {
  try {
    // Verificar si ya existe una clase con el mismo nombre
    const existingClass = await prisma.class.findUnique({
      where: { name: data.name },
    });

    if (existingClass) {
      return {
        success: false,
        error: true,
        message:
          "Ya existe una clase con este nombre. Por favor, elija otro nombre.",
      };
    }

    // Verificar que el grado exista
    const grade = await prisma.grade.findUnique({
      where: { id: Number(data.gradeId) },
    });

    if (!grade) {
      return {
        success: false,
        error: true,
        message: "La clase seleccionado no existe.",
      };
    }

    // Verificar que el supervisor exista (si se proporciona)
    if (data.supervisorId) {
      const supervisor = await prisma.teacher.findUnique({
        where: { id: data.supervisorId },
      });

      if (!supervisor) {
        return {
          success: false,
          error: true,
          message: "El supervisor seleccionado no existe.",
        };
      }
    }

    // Crear la clase
    await prisma.class.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        supervisorId: data.supervisorId || null,
        gradeId: Number(data.gradeId),
      },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al crear la clase:", err);
    return {
      success: false,
      error: true,
      message: "Error al crear la clase. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- UPDATE CLASS ---
export const updateClass = async (
  currentState: ActionState,
  data: ClassSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "ID de clase no proporcionado",
      };
    }

    // Verificar si existe otra clase con el mismo nombre (excluyendo la actual)
    const existingClass = await prisma.class.findFirst({
      where: {
        name: data.name,
        NOT: { id: data.id },
      },
    });

    if (existingClass) {
      return {
        success: false,
        error: true,
        message:
          "Ya existe otra clase con este nombre. Por favor, elija otro nombre.",
      };
    }

    // Verificar la cantidad de estudiantes actual vs. la nueva capacidad
    const currentStudentCount = await prisma.student.count({
      where: { classId: data.id },
    });

    if (currentStudentCount > data.capacity) {
      return {
        success: false,
        error: true,
        message: `No se puede reducir la capacidad a ${data.capacity} porque hay ${currentStudentCount} estudiantes asignados a esta clase.`,
      };
    }

    // Actualizar la clase
    await prisma.class.update({
      where: { id: data.id },
      data: {
        name: data.name,
        capacity: data.capacity,
        supervisorId: data.supervisorId || null,
        gradeId: Number(data.gradeId),
      },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error al actualizar la clase:", err);
    return {
      success: false,
      error: true,
      message: "Error al actualizar la clase. Por favor, inténtalo de nuevo.",
    };
  }
};

// --- DELETE CLASS ---
export const deleteClass = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const classId = parseInt(id);

    // Verificar si hay estudiantes asociados a esta clase
    const studentsCount = await prisma.student.count({
      where: { classId },
    });

    if (studentsCount > 0) {
      return {
        success: false,
        error: true,
        message: `No se puede eliminar esta clase porque hay ${studentsCount} estudiantes asignados a ella. Reasigna o elimina los estudiantes primero.`,
      };
    }

    // Si no hay estudiantes, podemos eliminar la clase
    await prisma.class.delete({
      where: { id: classId },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error al eliminar la clase:", err);

    // Manejar específicamente el error de restricción de clave foránea
    if (err?.code === "P2003") {
      return {
        success: false,
        error: true,
        message:
          "No se puede eliminar esta clase porque hay registros relacionados. Asegúrate de que no haya estudiantes, lecciones u otros datos asociados a esta clase.",
      };
    }

    return {
      success: false,
      error: true,
      message: "Error al eliminar la clase. Por favor, inténtalo de nuevo.",
    };
  }
};

export const createTeacher = async (
  currentState: ActionState,
  data: FormData
) => {
  try {
    // Extract form data
    const username = data.get("username") as string;
    const password = data.get("password") as string;
    const name = data.get("name") as string;
    const surname = data.get("surname") as string;
    const email = data.get("email") as string;
    const phone = data.get("phone") as string;
    const address = data.get("address") as string;
    const img = data.get("img") as string;
    const bloodType = data.get("bloodType") as string;
    const sex = data.get("sex") as string;
    const birthday = new Date(data.get("birthday") as string);

    // Extract class IDs
    const classes = data
      .getAll("classes[]")
      .map((classId) => classId.toString());

    // Get subjects as array
    const subjects = data
      .getAll("subjects[]")
      .map((subjectId) => subjectId.toString());

    // Validate username format (6 digits)
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
    const existingTeacherUsername = await prisma.teacher.findUnique({
      where: { username },
    });

    if (existingTeacherUsername) {
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

    // Check if a teacher with this phone already exists
    if (phone) {
      const existingTeacherPhone = await prisma.teacher.findFirst({
        where: { phone },
      });

      if (existingTeacherPhone) {
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
    const clerkUsername = `teacher_${username}`;

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

    // Create teacher in database
    await prisma.teacher.create({
      data: {
        id: user.id,
        username: username, // Keep the numeric username in the database
        name,
        surname,
        email: email || null,
        phone: phone || null,
        address,
        img: img || null,
        bloodType,
        sex: sex as "MALE" | "FEMALE",
        birthday,
        subjects: {
          connect: subjects.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
        classes: {
          connect: classes.map((classId: string) => ({
            id: parseInt(classId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");

    // Return success with teacher data for the success dialog
    return {
      success: true,
      error: false,
      data: {
        name,
        surname,
        username,
        password,
        email,
        img,
      },
    };
  } catch (err: any) {
    console.error("Error creating teacher:", err);

    // Handle Clerk validation errors
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

    // Handle Prisma errors - specifically unique constraint violations
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      // Check if the username field is the one with the constraint violation
      if (err.meta && err.meta.target && Array.isArray(err.meta.target)) {
        if (err.meta.target.includes("username")) {
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
        if (err.meta.target.includes("email")) {
          return {
            success: false,
            error: true,
            prismaErrors: [
              {
                code: "unique_constraint",
                field: "email",
                message:
                  "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
              },
            ],
          };
        }
      }
    }

    return { success: false, error: true };
  }
};

// Helper function to localize Clerk error messages
function localizeClerkError(code: string, defaultMessage: string): string {
  switch (code) {
    case "form_identifier_exists":
      return "Este identificador ya está en uso. Por favor, utiliza otro.";
    case "form_username_invalid_character":
      return "El no de cuenta contiene caracteres inválidos.";
    case "form_password_pwned":
      return "Esta contraseña no es segura. Por favor, usa una contraseña diferente.";
    case "form_password_requirements":
      return "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número.";
    case "form_email_invalid":
      return "El correo electrónico no es válido.";
    default:
      return defaultMessage;
  }
}

// Helper function to validate password
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

export const updateTeacher = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;
  if (!id) {
    return { success: false, error: true };
  }

  try {
    // Extract form data
    const username = data.get("username") as string;
    const password = data.get("password") as string;
    const name = data.get("name") as string;
    const surname = data.get("surname") as string;
    const email = data.get("email") as string;
    const phone = data.get("phone") as string;
    const address = data.get("address") as string;
    const img = data.get("img") as string;
    const bloodType = data.get("bloodType") as string;
    const sex = data.get("sex") as string;
    const birthday = new Date(data.get("birthday") as string);

    // Extract class IDs
    const classes = data
      .getAll("classes[]")
      .map((classId) => classId.toString());

    // Get subjects as array
    const subjects = data
      .getAll("subjects[]")
      .map((subjectId) => subjectId.toString());

    // Validate username format (6 digits)
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

    // Check if a different teacher already has this username
    const existingTeacher = await prisma.teacher.findUnique({
      where: { username },
    });

    if (existingTeacher && existingTeacher.id !== id) {
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

    // Check if a different teacher already has this email
    if (email) {
      const existingTeacherEmail = await prisma.teacher.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (existingTeacherEmail) {
        return {
          success: false,
          error: true,
          prismaErrors: [
            {
              code: "unique_constraint",
              field: "email",
              message:
                "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
            },
          ],
        };
      }
    }

    // Ensure the username is properly formatted for Clerk
    const clerkUsername = `teacher_${username}`;

    // Check if password meets Clerk requirements (if provided)
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

    // Update the Clerk user
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

    // Update the database record
    await prisma.teacher.update({
      where: {
        id: id,
      },
      data: {
        username,
        name,
        surname,
        email: email || null,
        phone: phone || null,
        address,
        img: img || null,
        bloodType,
        sex: sex as "MALE" | "FEMALE",
        birthday,
        subjects: {
          set: subjects.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
        classes: {
          set: classes.map((classId: string) => ({
            id: parseInt(classId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating teacher:", err);

    // Handle Clerk validation errors
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

    // Handle Prisma errors - specifically unique constraint violations
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      // Check if the username field is the one with the constraint violation
      if (err.meta && err.meta.target && Array.isArray(err.meta.target)) {
        if (err.meta.target.includes("username")) {
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
        if (err.meta.target.includes("email")) {
          return {
            success: false,
            error: true,
            prismaErrors: [
              {
                code: "unique_constraint",
                field: "email",
                message:
                  "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
              },
            ],
          };
        }
      }
    }

    return { success: false, error: true };
  }
};

export async function deleteTeacher(currentState: ActionState, data: FormData) {
  const id = data.get("id") as string;
  try {
    console.log("Deleting teacher with ID:", id);

    // Delete from database first
    try {
      await prisma.teacher.delete({
        where: {
          id: id,
        },
      });
      console.log("Successfully deleted teacher from database");
    } catch (dbError) {
      console.error("Error deleting teacher from database:", dbError);
      throw dbError; // Rethrow to be caught by the outer try/catch
    }

    try {
      await clerkClient.users.deleteUser(id);
      console.log("Successfully deleted teacher from Clerk");
    } catch (clerkError) {
      console.error("Error deleting teacher from Clerk:", clerkError);
    }

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error in deleteTeacher action:", err);
    return { success: false, error: true };
  }
}

// --- CREATE STUDENT ---
export const createStudent = async (
  currentState: ActionState,
  data: StudentSchema
) => {
  try {
    // Validate username format (6 digits)
    if (!/^\d{6}$/.test(data.username)) {
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

    // Check if a student with this username already exists
    const existingStudentUsername = await prisma.student.findUnique({
      where: { username: data.username },
    });
    if (existingStudentUsername) {
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

    // Check if a student with this phone already exists
    if (data.phone) {
      const existingStudentPhone = await prisma.student.findFirst({
        where: { phone: data.phone },
      });
      if (existingStudentPhone) {
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

    // Validate classId is present and a number
    if (!data.classId || isNaN(Number(data.classId))) {
      return {
        success: false,
        error: true,
        prismaErrors: [
          {
            code: "validation_error",
            field: "classId",
            message: "Debes seleccionar una clase válida.",
          },
        ],
      };
    }
    const classId = Number(data.classId);

    // Check class exists and has capacity
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: { _count: { select: { students: true } } },
    });
    if (!classItem) {
      return {
        success: false,
        error: true,
        prismaErrors: [
          {
            code: "not_found",
            field: "classId",
            message: "La clase seleccionada no existe.",
          },
        ],
      };
    }
    if (classItem.capacity === classItem._count.students) {
      return {
        success: false,
        error: true,
        prismaErrors: [
          {
            code: "full_class",
            field: "classId",
            message: "La clase seleccionada ya está llena.",
          },
        ],
      };
    }

    // Validate password
    if (!validatePassword(data.password)) {
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
    const username = `student_${data.username}`;
    let user;
    try {
      user = await clerkClient.users.createUser({
        username: username,
        password: data.password,
        firstName: data.name,
        lastName: data.surname,
        publicMetadata: { role: "student" },
      });
    } catch (err: any) {
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

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: classId,
        parentId: data.parentId ?? null,
      },
    });

    revalidatePath("/list/students");
    return {
      success: true,
      error: false,
      data: {
        name: data.name,
        surname: data.surname,
        username: data.username,
        password: data.password,
        email: data.email,
        img: data.img,
      },
    };
  } catch (err: any) {
    console.error("Error creating student:", err);
    if (err && typeof err === "object" && "errors" in err) {
      return {
        success: false,
        error: true,
        clerkErrors: err.errors,
      };
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      if (err.meta && err.meta.target && Array.isArray(err.meta.target)) {
        if (err.meta.target.includes("username")) {
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
        if (err.meta.target.includes("email")) {
          return {
            success: false,
            error: true,
            prismaErrors: [
              {
                code: "unique_constraint",
                field: "email",
                message:
                  "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
              },
            ],
          };
        }
      }
    }
    return { success: false, error: true };
  }
};

// --- UPDATE STUDENT ---
export const updateStudent = async (
  currentState: ActionState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    // Validate username format (6 digits)
    if (!/^\d{6}$/.test(data.username)) {
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

    // Check if a different student already has this username
    const existingStudent = await prisma.student.findUnique({
      where: { username: data.username },
    });
    if (existingStudent && existingStudent.id !== data.id) {
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

    // Check if a different student already has this email
    if (data.email) {
      const existingStudentEmail = await prisma.student.findFirst({
        where: {
          email: data.email,
          NOT: { id: data.id },
        },
      });
      if (existingStudentEmail) {
        return {
          success: false,
          error: true,
          prismaErrors: [
            {
              code: "unique_constraint",
              field: "email",
              message:
                "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
            },
          ],
        };
      }
    }

    // Validate password if provided
    if (data.password && !validatePassword(data.password)) {
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

    // Ensure the username is properly formatted for Clerk
    const username = `student_${data.username}`;
    try {
      await clerkClient.users.updateUser(data.id, {
        username: username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
      });
    } catch (err: any) {
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

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId ?? "",
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating student:", err);
    if (err && typeof err === "object" && "errors" in err) {
      return {
        success: false,
        error: true,
        clerkErrors: err.errors,
      };
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      if (err.meta && err.meta.target && Array.isArray(err.meta.target)) {
        if (err.meta.target.includes("username")) {
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
        if (err.meta.target.includes("email")) {
          return {
            success: false,
            error: true,
            prismaErrors: [
              {
                code: "unique_constraint",
                field: "email",
                message:
                  "Este correo electrónico ya está en uso. Por favor, utiliza otro correo.",
              },
            ],
          };
        }
      }
    }
    return { success: false, error: true };
  }
};

// --- DELETE STUDENT ---
export const deleteStudent = async (
  currentState: ActionState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Delete from database first
    try {
      await prisma.student.delete({
        where: {
          id: id,
        },
      });
    } catch (dbError) {
      console.error("Error deleting student from database:", dbError);
      throw dbError;
    }

    // Then try to delete from Clerk
    try {
      await clerkClient.users.deleteUser(id);
    } catch (clerkError) {
      console.error("Error deleting student from Clerk:", clerkError);
      // We continue even if Clerk deletion fails
    }

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error in deleteStudent action:", err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: ActionState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: ActionState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (currentState: ActionState, data: FormData) => {
  const id = data.get("id") as string;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting exam:", err);
    return { success: false, error: true };
  }
};
