"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Calendar, Activity, Shield, Eye } from "lucide-react";

export default function AdminSesiones() {
  const { data: session, status } = useSession();
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sesionesActivas: 0,
    sesionesHoy: 0,
    tiempoPromedio: 0,
    usuariosUnicos: 0
  });

  useEffect(() => {
    if (session?.user) {
      fetchSesiones();
      fetchStats();
    }
  }, [session]);

  const fetchSesiones = async () => {
    try {
      setLoading(true);
      // Aquí iría la lógica para obtener las sesiones
      // Por ahora simulamos datos
      const mockSesiones = [
        {
          id: 1,
          usuario: "Juan Pérez",
          email: "juan@email.com",
          inicioSesion: new Date().toISOString(),
          ultimaActividad: new Date().toISOString(),
          duracion: "25 min",
          activa: true,
          ip: "192.168.1.1",
          navegador: "Chrome"
        },
        {
          id: 2,
          usuario: "María García",
          email: "maria@email.com",
          inicioSesion: new Date(Date.now() - 3600000).toISOString(),
          ultimaActividad: new Date(Date.now() - 1800000).toISOString(),
          duracion: "45 min",
          activa: false,
          ip: "192.168.1.2",
          navegador: "Firefox"
        }
      ];
      setSesiones(mockSesiones);
    } catch (error) {
      console.error('Error fetching sesiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Aquí iría la lógica para obtener estadísticas
      setStats({
        sesionesActivas: 3,
        sesionesHoy: 15,
        tiempoPromedio: 32,
        usuariosUnicos: 12
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Debug: mostrar la información del usuario para verificar la estructura
  console.log('Session user:', session?.user);
  console.log('User role:', session?.user?.role);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sesión Requerida
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Debes iniciar sesión para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  // Por ahora, permitir acceso a cualquier usuario logueado para testing
  // Más adelante se puede cambiar por: session.user?.role !== 'admin'
  const isAdmin = session?.user?.role === 'admin' || session?.user?.email?.includes('admin') || true;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a esta página
          </p>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Debug: Role = {session?.user?.role || 'undefined'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Gestión de Sesiones
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitorea y administra las sesiones de usuario activas
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sesión actual: {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Rol: {session?.user?.role || 'No definido'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sesiones Activas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.sesionesActivas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sesiones Hoy
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.sesionesHoy}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tiempo Promedio
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.tiempoPromedio}m
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Usuarios Únicos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.usuariosUnicos}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Sesiones Recientes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Última Actividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IP / Navegador
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sesiones.map((sesion) => (
                    <tr key={sesion.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {sesion.usuario.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {sesion.usuario}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {sesion.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sesion.activa
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {sesion.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {sesion.duracion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(sesion.ultimaActividad).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <div>{sesion.ip}</div>
                          <div className="text-xs">{sesion.navegador}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
