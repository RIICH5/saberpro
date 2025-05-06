import { z } from "zod";

export const subjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: "Se requiere el nombre" }),
  teachers: z.array(z.number().or(z.string())).optional(),
});

export const classSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: "Se requiere el nombre" }),
  teacherId: z.string(),
  capacity: z.number().min(1),
  gradeId: z.number(),
});

export const teacherSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Se requiere el nombre" }),
  surname: z.string().min(1, { message: "Se requiere el apellido" }),
  username: z
    .string()
    .min(6, { message: "El número de cuenta debe tener 6 dígitos" })
    .max(6, { message: "El número de cuenta debe tener 6 dígitos" })
    .regex(/^\d+$/, {
      message: "El número de cuenta solo debe contener números",
    }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
      message:
        "La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número",
    }),
  email: z
    .string()
    .email({ message: "Formato de correo electrónico inválido" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string(),
  birthday: z.date(),
  sex: z.enum(["MALE", "FEMALE"]),
  subjects: z
    .array(z.string())
    .min(1, { message: "Seleccione al menos una asignatura" })
    .optional(),
});

export const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Se requiere el nombre" }),
  surname: z.string().min(1, { message: "Se requiere el apellido" }),
  username: z
    .string()
    .min(6, { message: "El número de cuenta debe tener 6 dígitos" })
    .max(6, { message: "El número de cuenta debe tener 6 dígitos" })
    .regex(/^\d+$/, {
      message: "El número de cuenta solo debe contener números",
    }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
      message:
        "La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número",
    }),
  email: z
    .string()
    .email({ message: "Formato de correo electrónico inválido" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string(),
  birthday: z.date(),
  sex: z.enum(["MALE", "FEMALE"]),
  gradeId: z.number(),
  classId: z.number(),
  parentId: z.string().optional(),
});

export const examSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: "Se requiere el título" }),
  startTime: z.date(),
  endTime: z.date(),
  lessonId: z.number(),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;
export type ClassSchema = z.infer<typeof classSchema>;
export type TeacherSchema = z.infer<typeof teacherSchema>;
export type StudentSchema = z.infer<typeof studentSchema>;
export type ExamSchema = z.infer<typeof examSchema>;
