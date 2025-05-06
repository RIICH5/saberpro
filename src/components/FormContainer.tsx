"use client";

import FormModal from "./FormModal";

export type FormContainerClientProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  teacherInfo?: {
    name: string;
    username: string;
  };
  studentInfo?: {
    name: string;
    username: string;
  };
  relatedData?: any;
  userRole?: string;
  onComplete?: () => void;
};

const FormContainerClient = ({
  table,
  type,
  data,
  id,
  teacherInfo,
  relatedData = {},
  userRole,
  onComplete,
}: FormContainerClientProps) => {
  return (
    <div>
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
        teacherInfo={teacherInfo}
        userRole={userRole}
        onComplete={onComplete}
      />
    </div>
  );
};

export default FormContainerClient;
