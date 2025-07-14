import {
  Shield,
  AlertTriangle,
  Database,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Info,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../app/components/ui/card";
import { Badge } from "../../../app/components/ui/badge";
import { Button } from "../../../app/components/ui/button";
import { useEffect, useRef } from "react";

/**
 * Documentación de políticas de eliminación de usuarios
 * Explica las implicaciones y mejores prácticas
 */
export default function UserDeletionPolicies({ onClose }) {
  const modalRef = useRef(null);

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-4 min-h-screen flex items-center justify-center py-8"
      onClick={handleBackdropClick}
    >
      <Card
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl">
                Políticas de Eliminación de Usuarios
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Introducción */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Sistema de Eliminación Segura
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  El sistema implementa múltiples capas de seguridad para
                  prevenir pérdida accidental de datos y proteger el contenido
                  de la comunidad. Todas las eliminaciones se registran para
                  auditoría.
                </p>
              </div>
            </div>
          </div>

          {/* Tipos de Eliminación */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <Database className="h-5 w-5" />
              Estrategias de Eliminación
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Eliminación Segura */}
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      Eliminación Segura
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                    >
                      Recomendada
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-green-800 dark:text-green-200">
                    <strong>Preserva el contenido público</strong>{" "}
                    desasociándolo del usuario.
                  </p>
                  <ul className="space-y-1 text-green-700 dark:text-green-300">
                    <li>• Mantiene salas y murales públicos</li>
                    <li>• Marca contenido como "anónimo"</li>
                    <li>• Preserva colaboraciones existentes</li>
                    <li>• Opción de reasignar a administrador</li>
                  </ul>
                  <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded text-xs">
                    <strong>Cuándo usar:</strong> Usuarios con contenido público
                    o perfil de artista
                  </div>
                </CardContent>
              </Card>

              {/* Eliminación Completa */}
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Eliminación Completa
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                    >
                      Destructiva
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-red-800 dark:text-red-200">
                    <strong>Elimina todo el contenido</strong> del usuario
                    permanentemente.
                  </p>
                  <ul className="space-y-1 text-red-700 dark:text-red-300">
                    <li>• Borra salas y murales creados</li>
                    <li>• Elimina colaboraciones</li>
                    <li>• Remueve favoritos y colecciones</li>
                    <li>• Acción irreversible</li>
                  </ul>
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-xs">
                    <strong>Cuándo usar:</strong> Usuarios spam, cuentas test o
                    solicitud expresa
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Validaciones de Seguridad */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <AlertTriangle className="h-5 w-5" />
              Validaciones de Seguridad
            </h3>

            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Bloqueos Automáticos
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • <strong>Auto-eliminación:</strong> Los administradores no
                    pueden eliminar su propia cuenta
                  </li>
                  <li>
                    • <strong>Contenido público:</strong> Requiere confirmación
                    adicional si hay salas/murales públicos
                  </li>
                  <li>
                    • <strong>Perfiles de artista:</strong> Advertencia especial
                    para usuarios con perfil profesional
                  </li>
                  <li>
                    • <strong>Colaboraciones activas:</strong> Notificación
                    sobre impacto en otros usuarios
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Registro de Auditoría
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • <strong>Usuario eliminado:</strong> ID y datos básicos
                  </li>
                  <li>
                    • <strong>Administrador responsable:</strong> Quién ejecutó
                    la eliminación
                  </li>
                  <li>
                    • <strong>Estrategia usada:</strong> Tipo de eliminación
                    aplicada
                  </li>
                  <li>
                    • <strong>Impacto:</strong> Cantidad de contenido afectado
                  </li>
                  <li>
                    • <strong>Timestamp:</strong> Fecha y hora exacta
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Análisis de Impacto */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <Users className="h-5 w-5" />
              Análisis de Impacto
            </h3>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm mb-3">
                Antes de cada eliminación, el sistema analiza automáticamente:
              </p>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-semibold mb-2">Contenido Propio</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Número de salas creadas</li>
                    <li>• Murales propios</li>
                    <li>• Contenido público vs privado</li>
                    <li>• Perfil de artista activo</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Impacto en Comunidad</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Colaboraciones activas</li>
                    <li>• Usuarios que siguen su contenido</li>
                    <li>• Salas compartidas</li>
                    <li>• Favoritos de otros usuarios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mejores Prácticas */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <CheckCircle className="h-5 w-5" />
              Mejores Prácticas
            </h3>

            <div className="space-y-3">
              <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950 p-3">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  ✅ Recomendado
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>
                    • Usar "Preservar contenido" para usuarios con obra pública
                  </li>
                  <li>
                    • Reasignar contenido valioso a cuentas administrativas
                  </li>
                  <li>
                    • Contactar al usuario antes de eliminar (si es posible)
                  </li>
                  <li>• Revisar el análisis de impacto completamente</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950 p-3">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  ❌ Evitar
                </h4>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• Eliminación completa sin revisar el contenido</li>
                  <li>• Borrar usuarios artistas sin preservar su obra</li>
                  <li>• Usar "Forzar eliminación" como primera opción</li>
                  <li>• Eliminar sin notificar a colaboradores afectados</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Opciones de Recuperación */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <Database className="h-5 w-5" />
              Recuperación y Reversión
            </h3>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    Limitaciones de Recuperación
                  </h4>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
                    <p>
                      <strong>Datos del usuario:</strong> Una vez eliminado, el
                      usuario debe crear una nueva cuenta. No es posible
                      restaurar credenciales o preferencias.
                    </p>
                    <p>
                      <strong>Contenido preservado:</strong> Si se usó
                      "preservar contenido", los murales y salas permanecen pero
                      como contenido anónimo.
                    </p>
                    <p>
                      <strong>Contenido reasignado:</strong> Si se reasignó a un
                      admin, se puede transferir nuevamente al usuario si crea
                      una nueva cuenta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de cerrar */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Entendido</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
