"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function EmailVerifyConfirm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return; // Evita doble fetch
    fetched.current = true;
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    fetch(`/api/usuarios/email/verify/confirm?token=${token}`)
      .then((res) => {
        if (res.ok) {
          setStatus("success");
          signIn(undefined, { redirect: false }); // Refresca la sesión
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Verificando tu correo...</div>
      </div>
    );
  }
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-green-600 text-xl font-bold">
          ¡Correo verificado!
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-600 text-xl font-bold">
        Token inválido o expirado
      </div>
    </div>
  );
}
