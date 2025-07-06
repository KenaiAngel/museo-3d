"use client";

import MuralCard from "./MuralCard";

const MuralGrid = ({ 
  murales, 
  view = 'grid', 
  onEditMural, 
  onDeleteMural 
}) => {
  return (
    <div className={
      view === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        : 'space-y-4'
    }>
      {murales.map((mural) => (
        <MuralCard
          key={mural.id}
          mural={mural}
          view={view}
          onEdit={onEditMural}
          onDelete={onDeleteMural}
        />
      ))}
    </div>
  );
};

export default MuralGrid;
