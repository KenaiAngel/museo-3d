import { useState, useEffect, useRef } from "react";
import { Button } from "../../../app/components/ui/button";
import { Badge } from "../../../app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/ui/card";
import {
  AlertTriangle,
  Shield,
  Database,
  Users,
  Image,
  Settings,
  Info,
  X,
} from "lucide-react";

/**
 * Modal seguro para confirmación de eliminación de usuarios
 * Muestra análisis de impacto y opciones de preservación
 */
function SafeDeleteUserModal({
  user,
  analysis,
  options,
  onOptionsChange,
  onConfirm,
  onCancel,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modalRef = useRef(null);

  if (!user || !analysis) return null;

  // Hacer scroll al modal cuando se monta
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, []);

  const hasContent =
    analysis.impact.salasCreadas > 0 || analysis.impact.muralesCreados > 0;
  const hasPublicContent =
    analysis.impact.salasPublicas > 0 || analysis.impact.muralesPublicos > 0;
  const isHighRisk = hasPublicContent || analysis.impact.esArtista;

  // Manejar clic fuera del modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-4 min-h-screen flex items-center justify-center py-8"
      onClick={handleBackdropClick}
    >
      <Card
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón X más visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="absolute top-3 right-3 z-10 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="pr-12">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-xl">
              Confirmar eliminación de usuario
            </CardTitle>
          </div>
          <p className="text-muted-foreground">
            Usuario: <span className="font-semibold">{user.nombre}</span> (
            {user.email})
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Análisis de Impacto */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Database className="h-4 w-4" />
              Análisis de Impacto
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Salas creadas:</span>
                  <Badge
                    variant={
                      analysis.impact.salasCreadas > 0
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {analysis.impact.salasCreadas}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Murales creados:</span>
                  <Badge
                    variant={
                      analysis.impact.muralesCreados > 0
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {analysis.impact.muralesCreados}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Es artista:</span>
                  <Badge
                    variant={
                      analysis.impact.esArtista ? "destructive" : "secondary"
                    }
                  >
                    {analysis.impact.esArtista ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Salas públicas:</span>
                  <Badge
                    variant={
                      analysis.impact.salasPublicas > 0
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {analysis.impact.salasPublicas}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Murales públicos:</span>
                  <Badge
                    variant={
                      analysis.impact.muralesPublicos > 0
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {analysis.impact.muralesPublicos}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Colaboraciones:</span>
                  <Badge variant="outline">
                    {analysis.impact.salasColabora +
                      analysis.impact.muralesColabora}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Advertencias de Seguridad */}
          {isHighRisk && (
            <div className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-2">
                    ⚠️ Eliminación de Alto Riesgo
                  </h4>
                  <ul className="text-sm text-destructive space-y-1">
                    {hasPublicContent && (
                      <li>
                        • El usuario tiene contenido público que será afectado
                      </li>
                    )}
                    {analysis.impact.esArtista && (
                      <li>
                        • El usuario tiene un perfil de artista con información
                        profesional
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Opciones de Eliminación */}
          {hasContent && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Settings className="h-4 w-4" />
                Opciones de Eliminación
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="preserve"
                    checked={options.preserveContent}
                    onChange={(e) =>
                      onOptionsChange({
                        ...options,
                        preserveContent: e.target.checked,
                        deleteContent: false,
                      })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium">Preservar contenido</span>
                      <Badge
                        variant="outline"
                        className="text-green-700 dark:text-green-300"
                      >
                        Recomendado
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      El contenido se mantiene activo pero se reasigna a
                      administración
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="delete"
                    checked={options.deleteContent}
                    onChange={(e) =>
                      onOptionsChange({
                        ...options,
                        deleteContent: e.target.checked,
                        preserveContent: false,
                      })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium">
                        Eliminar todo el contenido
                      </span>
                      <Badge variant="destructive">Peligroso</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Se eliminará permanentemente todo el contenido del usuario
                    </p>
                  </div>
                </label>
              </div>

              {/* Opción destacada: Forzar eliminación */}
              <div className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.forceDelete}
                    onChange={(e) =>
                      onOptionsChange({
                        ...options,
                        forceDelete: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-orange-900 dark:text-orange-100">
                        Forzar eliminación
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        Solo Admin
                      </Badge>
                    </div>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                      Omite todos los bloqueos de seguridad y procede con la
                      eliminación. Se registra en auditoría.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Opciones Avanzadas */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-muted-foreground"
            >
              {showAdvanced ? "Ocultar" : "Mostrar"} opciones avanzadas
            </Button>

            {showAdvanced && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/50 dark:bg-muted/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.notifyUser}
                    onChange={(e) =>
                      onOptionsChange({
                        ...options,
                        notifyUser: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">
                    Notificar al usuario por email
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.createBackup}
                    onChange={(e) =>
                      onOptionsChange({
                        ...options,
                        createBackup: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">
                    Crear respaldo antes de eliminar
                  </span>
                </label>

                {hasContent && options.preserveContent && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-2">
                      Reasignar contenido a:
                    </label>
                    <input
                      type="text"
                      placeholder="ID del administrador de destino"
                      value={options.adminUserId || ""}
                      onChange={(e) =>
                        onOptionsChange({
                          ...options,
                          adminUserId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Información Adicional */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Información importante:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Esta acción se registrará en los logs de auditoría</li>
                  <li>• Los datos pueden ser recuperables por 30 días</li>
                  <li>
                    • Se requiere confirmación adicional para contenido público
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={!analysis.canDelete}
              className="flex-1"
            >
              {isHighRisk
                ? "Confirmar eliminación de alto riesgo"
                : "Confirmar eliminación"}
            </Button>
          </div>

          {!analysis.canDelete && (
            <div className="text-center text-sm text-muted-foreground">
              No puedes eliminar tu propia cuenta de administrador
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SafeDeleteUserModal;
