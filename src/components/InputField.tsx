import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  hint?: string;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  hint,
}: InputFieldProps) => {
  if (hidden) {
    return (
      <input type="hidden" {...register(name)} defaultValue={defaultValue} />
    );
  }

  return (
    <div className={`flex flex-col gap-1 w-full`}>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        type={type}
        {...register(name)}
        className={`w-full p-3 border ${
          error ? "border-red-300 bg-red-50" : "border-gray-300"
        } rounded-md text-sm`}
        {...inputProps}
        defaultValue={defaultValue}
      />
      {error?.message && (
        <p className="text-xs text-red-500">{error.message.toString()}</p>
      )}
      {hint && !error?.message && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
};

export default InputField;
