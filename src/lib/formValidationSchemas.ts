import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z
    .string()
    .min(1, { message: "¡El nombre de la materia es obligatorio!" }),
  teachers: z.array(z.string()), // IDs de maestros
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z
    .string()
    .min(1, { message: "¡El nombre de la materia es obligatorio!" }),
  capacity: z.coerce
    .number()
    .min(1, { message: "¡La capacidad es obligatoria!" }),
  gradeId: z.coerce.number().min(1, { message: "¡El grado es obligatorio!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "¡El usuario debe tener al menos 3 caracteres!" })
    .max(20, { message: "¡El usuario debe tener máximo 20 caracteres!" }),
  password: z
    .string()
    .min(8, { message: "¡La contraseña debe tener al menos 8 caracteres!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "¡El nombre es obligatorio!" }),
  surname: z.string().min(1, { message: "¡El apellido es obligatorio!" }),
  email: z
    .string()
    .email({ message: "¡Correo electrónico inválido!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z
    .string()
    .min(1, { message: "¡El tipo de sangre es obligatorio!" }),
  birthday: z.coerce.date({
    message: "¡La fecha de nacimiento es obligatoria!",
  }),
  sex: z.enum(["MALE", "FEMALE"], { message: "¡El sexo es obligatorio!" }),
  subjects: z.array(z.string()).optional(),
  classes: z.array(z.string()).optional(), // IDs de clases
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "¡El usuario debe tener al menos 3 caracteres!" })
    .max(20, { message: "¡El usuario debe tener máximo 20 caracteres!" }),
  password: z
    .string()
    .min(8, { message: "¡La contraseña debe tener al menos 8 caracteres!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "¡El nombre es obligatorio!" }),
  surname: z.string().min(1, { message: "¡El apellido es obligatorio!" }),
  email: z
    .string()
    .email({ message: "¡Correo electrónico inválido!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z
    .string()
    .min(1, { message: "¡El tipo de sangre es obligatorio!" }),
  birthday: z.coerce.date({
    message: "¡La fecha de nacimiento es obligatoria!",
  }),
  sex: z.enum(["MALE", "FEMALE"], { message: "¡El sexo es obligatorio!" }),
  gradeId: z.coerce.number().min(1, { message: "¡El grado es obligatorio!" }),
  classId: z.coerce.number().min(1, { message: "¡La clase es obligatoria!" }),
  parentId: z.string().optional(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "¡El título es obligatorio!" }),
  startTime: z.coerce.date({ message: "¡La hora de inicio es obligatoria!" }),
  endTime: z.coerce.date({ message: "¡La hora de fin es obligatoria!" }),
  lessonId: z.coerce.number({ message: "¡La materia es obligatoria!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;
