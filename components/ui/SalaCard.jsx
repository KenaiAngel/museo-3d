import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Edit3, Trash2, ArrowRight } from "lucide-react";

export default function SalaCard({ sala, isAdmin, onEnter, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden group cursor-pointer transition hover:shadow-xl bg-white dark:bg-neutral-900/90 border border-border dark:border-white/20 shadow-lg dark:shadow-blue-900/40 p-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <img
          src={sala.imagen}
          alt={sala.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 align-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent dark:from-black/80 dark:via-black/60 dark:to-transparent" />
        <div className="absolute top-3 right-3 bg-background/90 dark:bg-black/80 rounded-full px-3 py-1 text-xs font-bold text-foreground dark:text-white shadow">
          {sala.cantidadMurales} obras
        </div>
      </div>
      <CardHeader className="flex-row items-center gap-3 pt-4 pb-2 px-6 text-gray-900 dark:text-white">
        <span className="text-2xl">{sala.icono || "🏛️"}</span>
        <CardTitle className="text-xl font-bold truncate flex-1">
          {sala.nombre}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-6 pb-2 text-gray-700 dark:text-gray-200">
        <CardDescription className="mb-2 line-clamp-2">
          {sala.descripcion}
        </CardDescription>
        <div className="text-xs text-muted-foreground dark:text-gray-400 mb-2">
          Propietario: {sala.propietario}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-between items-center px-6 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnter?.();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition dark:bg-indigo-400 dark:hover:bg-indigo-300 dark:text-black shadow dark:shadow-blue-900/30"
        >
          Entrar <ArrowRight className="h-4 w-4" />
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="p-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors dark:bg-yellow-300 dark:text-yellow-900 dark:hover:bg-yellow-200 shadow dark:shadow-yellow-900/20"
              title="Editar sala"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-400 dark:text-red-900 dark:hover:bg-red-300 shadow dark:shadow-red-900/20"
              title="Eliminar sala"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
