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
  id: z.number().optional(),
  name: z.string().min(1, { message: "El nombre de la clase es requerido" }),
  capacity: z.coerce
    .number()
    .min(1, { message: "La capacidad debe ser al menos 1" })
    .max(100, { message: "La capacidad máxima es 100" }),
  supervisorId: z.string().optional().nullable().or(z.literal("")),
  gradeId: z.string().min(1, { message: "Debe seleccionar un grado" }),
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

// Parent schema
export const parentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "El nombre es requerido" }),
  surname: z.string().min(1, { message: "El apellido es requerido" }),
  email: z
    .string()
    .email({ message: "Correo electrónico no válido" })
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, "")) // Remove non-digits
    .refine((val) => val === "" || val.length === 10, {
      message: "El teléfono debe tener 10 dígitos numéricos",
    })
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "¡La contraseña debe tener al menos 8 caracteres!" })
    .optional()
    .or(z.literal("")),
  img: z.string().optional().nullable(),
  students: z.array(z.string()).optional(),
  username: z
    .string()
    .min(6, { message: "¡El usuario debe tener al menos 6 caracteres!" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

// Enum para los días de la semana
export const DayEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
]);

export const lessonSchema = z
  .object({
    id: z.number().optional(),
    name: z
      .string()
      .min(1, { message: "El nombre de la lección es requerido" }),
    day: DayEnum,
    startTime: z.string().min(1, { message: "La hora de inicio es requerida" }),
    endTime: z
      .string()
      .min(1, { message: "La hora de finalización es requerida" }),
    subjectId: z
      .string()
      .min(1, { message: "Debe seleccionar una asignatura" }),
    classId: z.string().min(1, { message: "Debe seleccionar una clase" }),
    teacherId: z.string().min(1, { message: "Debe seleccionar un profesor" }),
  })
  .refine(
    (data) => {
      // Convertir las cadenas de hora a objetos Date para comparar
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "La hora de finalización debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  );

export type LessonSchema = z.infer<typeof lessonSchema>;

export const examSchema = z
  .object({
    id: z.number().optional(),
    title: z.string().min(1, { message: "El título del examen es requerido" }),
    startTime: z
      .string()
      .min(1, { message: "La fecha y hora de inicio son requeridas" }),
    endTime: z
      .string()
      .min(1, { message: "La fecha y hora de finalización son requeridas" }),
    lessonId: z
      .string()
      .or(z.number())
      .refine((val) => val !== undefined && val !== "", {
        message: "Debe seleccionar una lección",
      }),
  })
  .refine(
    (data) => {
      // Convertir las cadenas de hora a objetos Date para comparar
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message:
        "La fecha de finalización debe ser posterior a la fecha de inicio",
      path: ["endTime"],
    }
  );

export type ExamSchema = z.infer<typeof examSchema>;

export const assignmentSchema = z
  .object({
    id: z.number().optional(),
    title: z.string().min(1, { message: "El título de la tarea es requerido" }),
    startDate: z
      .string()
      .min(1, { message: "La fecha de inicio es requerida" }),
    dueDate: z.string().min(1, { message: "La fecha de entrega es requerida" }),
    lessonId: z
      .string()
      .or(z.number())
      .refine((val) => val !== undefined && val !== "", {
        message: "Debe seleccionar una lección",
      }),
  })
  .refine(
    (data) => {
      // Convertir las cadenas de fecha a objetos Date para comparar
      const start = new Date(data.startDate);
      const due = new Date(data.dueDate);
      return due > start;
    },
    {
      message: "La fecha de entrega debe ser posterior a la fecha de inicio",
      path: ["dueDate"],
    }
  );

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const resultSchema = z.object({
  id: z.number().optional(),
  score: z
    .number()
    .min(0, { message: "La calificación no puede ser menor a 0" })
    .max(100, { message: "La calificación no puede ser mayor a 100" })
    .or(
      z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .transform((val) => parseFloat(val))
    )
    .refine((val) => val >= 0 && val <= 100, {
      message: "La calificación debe estar entre 0 y 100",
    }),
  studentId: z.string().min(1, { message: "Debe seleccionar un estudiante" }),
  assessmentType: z.enum(["exam", "assignment"], {
    errorMap: () => ({ message: "Debe seleccionar un tipo de evaluación" }),
  }),
  assessmentId: z
    .string()
    .or(z.number())
    .refine((val) => val !== undefined && val !== "", {
      message: "Debe seleccionar una evaluación",
    }),
});

export type ResultSchema = z.infer<typeof resultSchema>;

export const attendanceSchema = z.object({
  id: z.number().optional(),
  date: z
    .string()
    .or(z.date())
    .refine((val) => val !== "", {
      message: "La fecha es requerida",
    }),
  present: z
    .boolean()
    .or(z.string().transform((val) => val === "true"))
    .or(z.number().transform((val) => val === 1)),
  studentId: z.string().min(1, { message: "El estudiante es requerido" }),
  lessonId: z
    .number()
    .or(z.string().transform((val) => parseInt(val)))
    .refine((val) => !isNaN(val), {
      message: "La lección es requerida",
    }),
});

export const attendanceBulkSchema = z.object({
  date: z
    .string()
    .or(z.date())
    .refine((val) => val !== "", {
      message: "La fecha es requerida",
    }),
  lessonId: z
    .number()
    .or(z.string().transform((val) => parseInt(val)))
    .refine((val) => !isNaN(val), {
      message: "La lección es requerida",
    }),
  attendances: z.array(
    z.object({
      studentId: z.string(),
      present: z
        .boolean()
        .or(z.string().transform((val) => val === "true"))
        .or(z.number().transform((val) => val === 1)),
    })
  ),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;
export type AttendanceBulkSchema = z.infer<typeof attendanceBulkSchema>;

export const eventSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: "El título es requerido" }),
  description: z.string().min(1, { message: "La descripción es requerida" }),
  startTime: z
    .string()
    .or(z.date())
    .refine((val) => val !== "", {
      message: "La fecha y hora de inicio son requeridas",
    }),
  endTime: z
    .string()
    .or(z.date())
    .refine((val) => val !== "", {
      message: "La fecha y hora de finalización son requeridas",
    }),
  classId: z
    .number()
    .nullable()
    .or(z.string().transform((val) => (val === "" ? null : parseInt(val)))),
});

// Ensure end time is after start time
export const eventSchemaWithValidation = eventSchema.refine(
  (data) => {
    if (!data.startTime || !data.endTime) return true;
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  {
    message: "La hora de finalización debe ser posterior a la hora de inicio",
    path: ["endTime"],
  }
);

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: "El título es requerido" }),
  description: z.string().min(1, { message: "La descripción es requerida" }),
  date: z
    .string()
    .or(z.date())
    .refine((val) => val !== "", {
      message: "La fecha es requerida",
    }),
  classId: z
    .number()
    .nullable()
    .or(z.string().transform((val) => (val === "" ? null : parseInt(val)))),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;
