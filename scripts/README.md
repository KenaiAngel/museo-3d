# Scripts del Proyecto Museo 3D

Esta carpeta contiene scripts utilitarios para el proyecto.

## Scripts Disponibles

### `optimize_images.js`

Script para optimizar imágenes del proyecto usando Sharp.

- Convierte JPG/PNG a WebP
- Comprime imágenes WebP grandes
- Útil para mejorar el rendimiento de la aplicación

**Uso:**

```bash
node scripts/optimize_images.js
```

## Scripts Eliminados

Los siguientes scripts han sido eliminados porque su funcionalidad está ahora integrada en `prisma/seed.js`:

- ~~`assign_userid_to_murales.js`~~ - Asignación de usuarios a murales
- ~~`associate_murales_salas.js`~~ - Asociación de murales con salas
- ~~`check_murales.js`~~ - Verificación de murales (usar Prisma Studio)
- ~~`delete_first_murales.js`~~ - Eliminación específica de murales
- ~~`import_murales_from_json.js`~~ - Importación desde JSON
- ~~`restore_murales.js`~~ - Restauración de murales

## Base de Datos

Para gestionar la base de datos usar:

```bash
# Resetear y sembrar la base de datos
npx prisma migrate reset --force

# Solo sembrar (sin reset)
npx prisma db seed

# Abrir Prisma Studio para visualizar datos
npx prisma studio
```

Todos los datos se cargan desde `public/murales_backup.json` mediante `prisma/seed.js`.
