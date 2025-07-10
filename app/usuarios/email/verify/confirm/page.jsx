"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function EmailVerifyConfirm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading, success, error

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    // Llama al endpoint API para validar el token
    fetch(`/api/usuarios/email/verify/confirm?token=${token}`)
      .then((res) => {
        if (res.redirected) {
          // Si el backend redirige, seguimos la redirección
          router.replace(res.url.replace("/api", ""));
          return;
        }
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Verificando tu correo...</div>
      </div>
    );
  }
  if (status === "success") {
    // Esto solo se muestra si el backend no redirige (por fallback)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-green-600 text-xl font-bold">¡Correo verificado!</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-600 text-xl font-bold">Token inválido o expirado</div>
    </div>
  );
} 