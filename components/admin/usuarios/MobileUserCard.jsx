import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Select, SelectItem } from "../../ui/select";
import MuralIcon from "../../ui/icons/MuralIcon";
import SalaIcon from "../../ui/icons/SalaIcon";
import PropTypes from "prop-types";

/**
 * Card de usuario para mobile con menú de acciones custom.
 * @param {object} user - Objeto usuario.
 * @param {object} defaultAvatar - Imagen por defecto.
 * @param {function} onDelete - Handler para eliminar usuario.
 * @param {function} onRoleChange - Handler para cambiar rol.
 * @param {array} roles - Lista de roles disponibles.
 */
export default function MobileUserCard({
  user,
  defaultAvatar,
  onDelete,
  onRoleChange,
  roles,
  onInvalidate,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);
  return (
    <div className="relative flex flex-col items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 px-4 py-5 mb-6">
      <Avatar className="w-16 h-16 mb-2">
        <AvatarImage
          src={user.image || defaultAvatar.src}
          alt={user.name || user.email}
        />
        <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-base text-center mb-1 text-foreground">
        {user.name || (
          <span className="italic text-muted-foreground">Sin nombre</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-2 text-center break-all">
        {user.email}
      </div>
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="flex flex-col items-center text-xs">
          <SalaIcon className="w-5 h-5 mb-0.5 text-blue-500 dark:text-blue-300" />
          <span>{user._count?.salasPropias ?? 0}</span>
          <span className="text-[10px] text-muted-foreground">Salas</span>
        </div>
        <div className="flex flex-col items-center text-xs">
          <MuralIcon className="w-5 h-5 mb-0.5 text-pink-500 dark:text-pink-300" />
          <span>{user.muralesCount ?? 0}</span>
          <span className="text-[10px] text-muted-foreground">Murales</span>
        </div>
      </div>
      <button
        className="absolute bottom-3 right-3 p-2 rounded-full hover:bg-muted transition z-20"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Acciones"
      >
        <svg
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-12 right-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 w-48 z-30 animate-fade-in"
        >
          <div className="mb-2">
            <span className="block text-xs text-muted-foreground mb-1">
              Rol
            </span>
            <Select
              value={user.role}
              onValueChange={(val) => {
                onRoleChange(user.id, val);
                setMenuOpen(false);
              }}
              className="w-full"
            >
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-1"
            onClick={() => {
              onDelete(user);
              setMenuOpen(false);
            }}
          >
            Eliminar usuario
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              onInvalidate(user.id);
              setMenuOpen(false);
            }}
            disabled={!user.emailVerified}
          >
            Invalidar
          </Button>
        </div>
      )}
    </div>
  );
}

MobileUserCard.propTypes = {
  user: PropTypes.object.isRequired,
  defaultAvatar: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  roles: PropTypes.array.isRequired,
  onInvalidate: PropTypes.func.isRequired,
};
