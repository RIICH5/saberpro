# SaberPro - Plataforma Escolar

Bienvenido a **SaberPro**, una plataforma integral para la gestión escolar, diseñada para escuelas mexicanas. Este sistema permite la administración de estudiantes, padres, profesores, clases, materias y más, todo desde una interfaz moderna y fácil de usar.

## Características principales

- **Gestión de usuarios:** Registro y administración de estudiantes, padres, profesores y administradores.
- **Control de clases y materias:** Asignación de materias y clases a estudiantes y profesores.
- **Panel de administración:** Acceso diferenciado según el rol (estudiante, padre, profesor, admin).
- **Autenticación segura:** Inicio de sesión con Clerk, incluyendo roles personalizados.
- **Soporte para CRUD:** Crear, leer, actualizar y eliminar registros de todas las entidades principales.
- **Interfaz amigable:** Diseño responsivo y moderno, optimizado para dispositivos móviles y escritorio.
- **Validaciones y mensajes claros:** Errores y validaciones en español mexicano.

## Instalación

```sh
git clone https://github.com/tu-usuario/full-stack-school.git
cd full-stack-school
npm install
```

Configura las variables de entorno:

- Copia el archivo `.env.example` a `.env` y agrega tus credenciales de base de datos y Clerk.

Ejecuta las migraciones de la base de datos:

```sh
npx prisma migrate dev
```

Inicia el servidor de desarrollo:

```sh
npm run dev
```

## Uso

- Accede a la plataforma en [http://localhost:3000](http://localhost:3000)
- Elige tu rol (estudiante, padre, profesor) en la pantalla de inicio de sesión.
- Para acceder como administrador, agrega `?admin=1` a la URL de inicio de sesión.

## Estructura del proyecto

- `/src/app` - Páginas y rutas principales de la aplicación.
- `/src/components` - Componentes reutilizables (formularios, tablas, wrappers).
- `/src/lib` - Lógica de negocio, validaciones y acciones.
- `/prisma` - Esquema y migraciones de la base de datos.
- `/public/branding` - Imágenes y recursos de marca.

## Tecnologías utilizadas

- **Next.js** (App Router)
- **TypeScript**
- **Prisma** (ORM)
- **Clerk** (autenticación)
- **Tailwind CSS**
- **PostgreSQL** (o cualquier base compatible con Prisma)

---

## Autores

- Manuel Adolfo Darío Escobedo
- Ricardo Carrera Morales

**Hecho con ❤️ en México**
