# Sistema de Gestión de Solicitudes de Rectificación
## GNARC – Gestora Pública de la Seguridad Social de Largo Plazo

Sistema web completo para la gestión de solicitudes de rectificación con flujo de trabajo, roles diferenciados y reportes.

---

## Stack Tecnológico

| Capa       | Tecnología                              |
|------------|-----------------------------------------|
| Backend    | Django 4.2 + Django REST Framework 3.15 |
| Auth       | JWT (djangorestframework-simplejwt)     |
| Base datos | PostgreSQL 15+                          |
| Frontend   | React 18 + Vite 5                       |
| UI         | Material-UI v5 (tema oscuro)            |
| Estado     | Zustand + React Query                   |
| Gráficos   | Recharts                                |
| Formularios| React Hook Form                         |

---

## Requisitos del Sistema

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

---

## Instalación y Configuración

### Base de datos

```sql
CREATE DATABASE gestion_rectificaciones;
```

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los datos de su base de datos

# Migraciones
python manage.py makemigrations accounts catalogos solicitudes
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

---

## URLs del Sistema

| Servicio       | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:5173            |
| Backend API    | http://localhost:8000/api/       |
| Admin Django   | http://localhost:8000/admin/     |

---

## Endpoints de la API

### Autenticación
- `POST /api/auth/token/` — Obtener tokens JWT
- `POST /api/auth/token/refresh/` — Renovar token de acceso

### Cuentas
- `GET/PATCH /api/accounts/me/` — Perfil del usuario actual
- `POST /api/accounts/change-password/` — Cambiar contraseña
- `GET/POST /api/accounts/users/` — CRUD de usuarios

### Solicitudes
- `GET/POST /api/solicitudes/solicitudes/` — Listado y creación
- `GET/PATCH /api/solicitudes/solicitudes/{id}/` — Detalle y edición
- `POST /api/solicitudes/solicitudes/{id}/cambiar_estado/` — Transición de workflow
- `GET /api/solicitudes/solicitudes/{id}/bitacora/` — Historial
- `GET /api/solicitudes/solicitudes/{id}/transiciones/` — Transiciones disponibles
- `GET /api/solicitudes/solicitudes/exportar/` — Exportar a Excel

### Catálogos
- `GET/POST /api/catalogos/{recurso}/` — CRUD de catálogos

### Reportes
- `GET /api/reportes/dashboard/` — Métricas del dashboard
- `GET /api/reportes/productividad/` — Productividad por analista
- `GET /api/reportes/causales/` — Reporte por causal
- `GET /api/reportes/exportar/` — Exportar reportes a Excel

---

## Roles y Permisos

| Rol       | Descripción          | Permisos principales                          |
|-----------|----------------------|-----------------------------------------------|
| ADMIN     | Administrador        | Acceso total, configuración, usuarios         |
| SUPER     | Súper Analista       | Asignación, aprobación/rechazo, reportes      |
| ANALIST   | Analista             | Crear, revisar, devolver solicitudes          |
| CONSULTA  | Solo lectura         | Ver solicitudes y reportes                    |

---

## Workflow de Estados

```
BORRADOR → PENDIENTE → ASIGNADO → EN REVISIÓN → APROBADO → FINALIZADO
                                               ↘ RECHAZADO → ANULADO
                          ↘ DEVUELTO → PENDIENTE
```

---

## Colores del Sistema

| Color       | Hex       | RGB           | Uso                           |
|-------------|-----------|---------------|-------------------------------|
| Oro         | #CBab58   | R203 G171 B88 | Color primario, acentos       |
| Oro oscuro  | #96783C   | —             | Hover, bordes                 |
| Navy        | #0F1932   | —             | Sidebar, fondo oscuro         |
| Navy2       | #19284B   | —             | Cards, AppBar                 |
| Fondo       | #0D1627   | —             | Fondo de página               |

---

## Estructura del Proyecto

```
gestion_rectificaciones/
├── backend/          # Django + DRF
│   ├── apps/
│   │   ├── accounts/ # Autenticación y usuarios
│   │   ├── catalogos/# Catálogos del sistema
│   │   ├── solicitudes/ # Core del negocio
│   │   └── reportes/ # Estadísticas y exports
│   └── config/       # Configuración Django
└── frontend/         # React + Vite
    └── src/
        ├── api/      # Clientes HTTP
        ├── components/ # Componentes reutilizables
        ├── pages/    # Páginas de la aplicación
        ├── store/    # Estado global (Zustand)
        └── theme.js  # Tema MUI personalizado
```
