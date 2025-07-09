import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUserResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/usuarios/email/${encodeURIComponent(
        email
      )}`
    );

    if (existingUserResponse.ok) {
      const existingUserData = await existingUserResponse.json();
      if (existingUserData.exists) {
        return NextResponse.json(
          { error: "El usuario ya existe" },
          { status: 409 }
        );
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear nuevo usuario
    const userData = {
      email,
      password: hashedPassword,
      name: name || email.split("@")[0], // Usar parte del email como nombre por defecto
      image: null,
      emailVerified: null,
    };

    const createUserResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/usuarios`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      return NextResponse.json(
        {
          error:
            "Error al crear el usuario: " +
            (errorData.error || "Error desconocido"),
        },
        { status: 500 }
      );
    }

    const newUser = await createUserResponse.json();

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en register:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
