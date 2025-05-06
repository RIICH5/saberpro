"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

const ROLES = [
  { label: "Estudiante", value: "student" },
  { label: "Padre", value: "parent" },
  { label: "Profesor", value: "teacher" },
];

const LoginPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [rawIdentifier, setRawIdentifier] = useState("");
  // This will store the actual identifier to be submitted
  const [actualIdentifier, setActualIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = searchParams?.get("admin") === "1";

  // Update the actual identifier whenever role or rawIdentifier changes
  useEffect(() => {
    if (!isAdmin && rawIdentifier) {
      setActualIdentifier(`${role}_${rawIdentifier}`);
    } else {
      setActualIdentifier(rawIdentifier);
    }
  }, [role, rawIdentifier, isAdmin]);

  useEffect(() => {
    const userRole = user?.publicMetadata.role;
    if (userRole) {
      setLoading(true);
      router.push(`/${userRole}`);
    } else {
      setLoading(false);
    }
  }, [user, router]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left column with form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Logo */}
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <Image
              alt="Saber Pro Logo"
              src="/branding/light-logo.png"
              className="object-contain"
              height={200}
              width={200}
            />
          </div>
        </div>

        {/* Content container */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-bold">Bienvenid@ a SaberPro</h1>
              <p className="text-sm text-gray-500 text-balance">
                La nueva forma de aprender. Inicia sesión para continuar.
              </p>
            </div>

            {/* Role Tabs (omit for admin) */}
            {!isAdmin && (
              <div className="flex justify-center gap-2 mt-8 mb-4">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`px-3 py-1 rounded-md text-sm font-medium border ${
                      role === r.value
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-300"
                    }`}
                    onClick={() => setRole(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Login form using Clerk Elements */}
            <div className="mt-4">
              <SignIn.Root>
                <SignIn.Step
                  name="start"
                  className="flex flex-col gap-6 p-6 rounded-lg"
                >
                  {/* Global error messages */}
                  <Clerk.GlobalError className="text-sm text-red-500 bg-red-50 p-3 rounded-md" />

                  {/* Real identifier field - this is hidden from the user */}
                  <div style={{ display: "none" }}>
                    <Clerk.Field name="identifier">
                      <Clerk.Input value={actualIdentifier} readOnly />
                    </Clerk.Field>
                  </div>

                  {/* Visual identifier field - just for user display */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium">
                      {isAdmin ? "Usuario Admin" : "Número de cuenta"}
                    </label>
                    {!isAdmin ? (
                      <input
                        value={rawIdentifier}
                        onChange={(e) => setRawIdentifier(e.target.value)}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        placeholder={isAdmin ? "admin" : "123456"}
                        className="p-2 rounded-md ring-1 ring-gray-300 w-full"
                        autoComplete="username"
                      />
                    ) : (
                      <Clerk.Field
                        name="identifier"
                        className="flex flex-col gap-2"
                      >
                        <Clerk.Input
                          type="text"
                          required
                          placeholder="admin"
                          className="p-2 rounded-md ring-1 ring-gray-300 w-full"
                          autoComplete="username"
                        />
                      </Clerk.Field>
                    )}
                  </div>

                  {/* Password field with toggle */}
                  <Clerk.Field name="password" className="flex flex-col gap-2">
                    <Clerk.Label className="text-xs font-medium">
                      Contraseña
                    </Clerk.Label>
                    <div className="relative">
                      <Clerk.Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="p-2 rounded-md ring-1 ring-gray-300 w-full pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Clerk.FieldError className="text-xs text-red-500" />
                  </Clerk.Field>

                  {/* Submit button */}
                  <SignIn.Action
                    submit
                    disabled={loading || (!actualIdentifier && !isAdmin)}
                    className="bg-black text-white rounded-md p-2 text-sm font-medium hover:bg-black/90 transition-colors mt-2 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
                  >
                    {loading ? "Cargando..." : "Iniciar sesión"}
                  </SignIn.Action>
                </SignIn.Step>
              </SignIn.Root>
            </div>
          </div>
        </div>
      </div>

      {/* Right column with background image */}
      <div className="bg-gray-100 relative hidden lg:block">
        <Image
          src="/branding/login-background.jpg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover brightness-150"
          fill
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8">
          <blockquote className="space-y-2 text-white/90">
            <p className="text-lg font-medium">
              "La educación es el arma más poderosa que puedes usar para cambiar
              el mundo."
            </p>
            <footer className="text-sm text-white/70">— Nelson Mandela</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
