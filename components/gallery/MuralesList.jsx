import MuralCard from "./MuralCard";

export default function MuralesList({
  murales,
  onMuralClick,
  onLike,
  likedMurales,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {murales.map((mural) => (
        <MuralCard
          key={mural.id}
          mural={mural}
          onClick={() => onMuralClick(mural)}
          onLike={() => onLike(mural)}
          isLiked={likedMurales?.includes(mural.id)}
        />
      ))}
    </div>
  );
}
