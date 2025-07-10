"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import Unauthorized from "../../../components/Unauthorized";
import { useSession } from "next-auth/react";
import { Input } from "../../components/ui/input";
import { Select, SelectItem } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import defaultAvatar from "public/assets/default-avatar.svg";
import {
  User as UserIcon,
  Mail as MailIcon,
  UserCog as RoleIcon,
  User2 as User2Icon,
  Settings as SettingsIcon,
} from "lucide-react";
import UserAvatarCell from "../../components/admin/usuarios/UserAvatarCell";
import MobileUserCard from "../../components/admin/usuarios/MobileUserCard";
import {
  AnimatedBlobsBackground,
  DotsPattern,
} from "../../components/admin/usuarios/Backgrounds";
import { useAdminUsers } from "../../hooks/useAdminUsers";

const ROLES = [
  { value: "USER", label: "Usuario" },
  { value: "ADMIN", label: "Admin" },
  { value: "ARTIST", label: "Artista" },
  { value: "CURATOR", label: "Curador" },
];

/**
 * Página principal de administración de usuarios.
 * Permite buscar, filtrar, editar roles y eliminar usuarios.
 */
export default function AdminUsuariosPage() {
  const { data: session, status } = useSession();
  // Hook custom para la lógica de usuarios
  const {
    users,
    loading,
    search,
    setSearch,
    role,
    setRole,
    handleRoleChange,
    handleDeleteUser,
    userToDelete,
    setUserToDelete,
    confirmDeleteUser,
    handleInvalidateEmail, // <-- nuevo
  } = useAdminUsers();

  // Acceso restringido a admins
  if (status === "loading") return <div>Cargando...</div>;
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <Unauthorized
        title="Acceso denegado"
        message="Esta sección es solo para administradores."
        error="403"
        showLogin={true}
        redirectPath="/"
      />
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="relative min-h-screen overflow-x-hidden flex flex-col items-center justify-start bg-transparent">
        {/* Fondo animado, patrón y graffiti sutil */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
          <AnimatedBlobsBackground />
          <DotsPattern />
        </div>
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-8 px-2 sm:px-8 py-8 md:py-14">
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            Administrar usuarios
          </h1>
          {/* Filtros de búsqueda y rol */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center w-full">
            <div className="relative w-full sm:w-auto flex-1 flex items-center">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none z-20">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/70 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary text-base text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 relative z-10"
                style={{ minWidth: 0 }}
              />
            </div>
            <div className="min-w-[140px] w-full sm:w-auto flex-shrink-0">
              <Select
                value={role}
                onValueChange={setRole}
                placeholder="Todos"
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/70 shadow-sm text-base text-foreground"
              >
                <SelectItem value="">Todos</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
          {/* Mobile: cards, Desktop: tabla */}
          <div className="block md:hidden w-full">
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                No se encontraron usuarios.
              </div>
            ) : (
              users.map((user) => (
                <MobileUserCard
                  key={user.id}
                  user={user}
                  defaultAvatar={defaultAvatar}
                  onDelete={handleDeleteUser}
                  onRoleChange={handleRoleChange}
                  roles={ROLES}
                  onInvalidate={handleInvalidateEmail}
                />
              ))
            )}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-2xl shadow bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 backdrop-blur-md table-bg-fix">
            <table className="min-w-full divide-y divide-muted text-base">
              <thead>
                <tr className="bg-muted/60">
                  <th className="px-4 py-4 text-center font-semibold w-20 align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <UserIcon className="w-5 h-5 text-primary/80 mb-1" />
                      <span className="text-xs">Foto</span>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-center font-semibold align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <User2Icon className="w-5 h-5 text-primary/80 mb-1" />
                      <span className="text-xs">Nombre</span>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-center font-semibold align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <MailIcon className="w-5 h-5 text-primary/80 mb-1" />
                      <span className="text-xs">Email</span>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-center font-semibold align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <RoleIcon className="w-5 h-5 text-primary/80 mb-1" />
                      <span className="text-xs">Rol</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-xs">Salas</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-xs">Murales</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <SettingsIcon className="w-5 h-5 text-primary/80 mb-1" />
                      <span className="text-xs">Acciones</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      Cargando...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/40 transition text-center align-middle"
                    >
                      <td className="px-4 py-4 w-20 align-middle">
                        <UserAvatarCell
                          user={user}
                          defaultAvatar={defaultAvatar}
                        />
                      </td>
                      <td className="px-5 py-4 font-medium align-middle">
                        {user.name || (
                          <span className="italic text-muted-foreground">
                            Sin nombre
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-middle break-all">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <Select
                          value={user.role}
                          onValueChange={(val) =>
                            handleRoleChange(user.id, val)
                          }
                          className="min-w-[100px]"
                        >
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        {user._count?.salasPropias ?? 0}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        {user.muralesCount ?? 0}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-full mr-2"
                          title="Eliminar usuario"
                        >
                          Eliminar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvalidateEmail(user.id)}
                          className="rounded-full mt-2"
                          title="Invalidar email"
                          disabled={!user.emailVerified}
                        >
                          Invalidar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal de confirmación de eliminación */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4">¿Eliminar usuario?</h2>
              <p className="mb-6">
                ¿Estás seguro de que deseas eliminar a{" "}
                <span className="font-semibold">
                  {userToDelete.name || userToDelete.email}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setUserToDelete(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDeleteUser}>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
