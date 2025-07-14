import React, { useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import AvatarTooltip from "../../ui/AvatarTooltip";
import PropTypes from "prop-types";

/**
 * Avatar de usuario con tooltip ampliado al hacer hover.
 * @param {object} user - Objeto usuario.
 * @param {object} defaultAvatar - Imagen por defecto.
 */
export default function UserAvatarCell({ user, defaultAvatar }) {
  const avatarRef = useRef();
  const [hovered, setHovered] = useState(false);
  return (
    <span
      ref={avatarRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-block" }}
    >
      <Avatar className="w-12 h-12 mx-auto cursor-pointer border transition-transform duration-200 hover:scale-110">
        <AvatarImage
          src={user.image || defaultAvatar.src}
          alt={user.name || user.email}
          onError={(e) => {
            e.target.src = defaultAvatar.src;
          }}
        />
        <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <AvatarTooltip
        src={user.image || defaultAvatar.src}
        alt={user.name || user.email}
        anchorRef={avatarRef}
        show={hovered}
      />
    </span>
  );
}

UserAvatarCell.propTypes = {
  user: PropTypes.object.isRequired,
  defaultAvatar: PropTypes.object.isRequired,
};
