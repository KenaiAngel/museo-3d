import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Select, SelectItem } from "../../ui/select";
import MuralIcon from "../../ui/icons/MuralIcon";
import SalaIcon from "../../ui/icons/SalaIcon";
import { Trash2, MailX, User2 } from "lucide-react";
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
  const buttonRef = useRef();
  const [buttonRect, setButtonRect] = useState(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      )
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  // Actualizar la posición del botón cuando se abre el menú
  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, [menuOpen]);

  const handleToggleMenu = () => {
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
    setMenuOpen(!menuOpen);
  };
  return (
    <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-4 mx-2">
      {/* Avatar con icono de foto mejorado */}
      <div className="relative flex-shrink-0 mr-4">
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={user.image || defaultAvatar.src}
            alt={user.name || user.email}
          />
          <AvatarFallback>
            <User2 className="w-6 h-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Información del usuario */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          {user.name || (
            <span className="italic text-muted-foreground">Sin nombre</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate mb-2">
          {user.email}
        </div>

        {/* Estadísticas en línea */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <SalaIcon className="w-4 h-4 text-blue-500 dark:text-blue-300" />
            <span className="font-medium">
              {user._count?.salasPropias ?? 0}
            </span>
            <span className="text-muted-foreground">salas</span>
          </div>
          <div className="flex items-center gap-1">
            <MuralIcon className="w-4 h-4 text-pink-500 dark:text-pink-300" />
            <span className="font-medium">{user.muralesCount ?? 0}</span>
            <span className="text-muted-foreground">murales</span>
          </div>
        </div>
      </div>

      {/* Botón de menú */}
      <button
        ref={buttonRef}
        className="flex-shrink-0 p-2 rounded-full hover:bg-muted transition"
        onClick={handleToggleMenu}
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

      {/* Menú desplegable usando portal */}
      {menuOpen &&
        buttonRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 w-48 animate-fade-in"
            style={{
              position: "fixed",
              top: buttonRect.bottom + window.scrollY + 4,
              right: window.innerWidth - buttonRect.right + window.scrollX,
              zIndex: 99999,
            }}
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
              <Trash2 className="w-4 h-4 mr-2" />
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
              <MailX className="w-4 h-4 mr-2" />
              Invalidar Email
            </Button>
          </div>,
          document.body
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
