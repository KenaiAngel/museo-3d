import MuralCard from "./MuralCard";

export default function MuralesList({
  murales,
  onMuralClick,
  onLike,
  likedMurales,
  view = "grid",
  onARClick,
}) {
  return (
    <div
      className={
        view === "list"
          ? "flex flex-col gap-4 overflow-hidden"
          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-hidden"
      }
    >
      {murales.map((mural) => (
        <MuralCard
          key={mural.id}
          mural={mural}
          onClick={() => onMuralClick(mural)}
          onLike={() => onLike(mural)}
          isLiked={likedMurales?.includes(mural.id)}
          view={view}
          onARClick={onARClick}
        />
      ))}
    </div>
  );
}
