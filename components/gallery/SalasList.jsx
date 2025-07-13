export default function SalasList({ salas, selectedSala, onSelectSala }) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {salas.map((sala) => (
        <button
          key={sala.id}
          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-neutral-900/80 border-border dark:border-neutral-700 ${selectedSala === sala.id ? "ring-2 ring-primary bg-primary/10 dark:bg-primary/20" : ""}`}
          onClick={() => onSelectSala(sala.id)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-lg text-foreground">
              {sala.nombre}
            </span>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full">
              {sala._count?.murales ?? sala.murales?.length ?? 0} obras
            </span>
          </div>
          {sala.descripcion && (
            <div className="text-xs text-muted-foreground mb-1 line-clamp-2">
              {sala.descripcion}
            </div>
          )}
          {sala.creador && (
            <div className="text-xs text-muted-foreground italic">
              Por: {sala.creador.name || sala.creador.email}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
