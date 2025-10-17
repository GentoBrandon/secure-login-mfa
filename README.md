# Secure Login MFA

## Descripción General

Este proyecto implementa un sistema de autenticación seguro con múltiples factores (MFA) que incluye:

- **Backend**: API REST desarrollada con NestJS que maneja autenticación JWT y MFA
- **API**: Servicio Express.js que proporciona endpoints para consultar productos
- **Base de Datos**: PostgreSQL para almacenamiento de datos

## Levantar Servicios con Docker Compose

### Prerrequisitos

- Docker instalado
- Docker Compose instalado
- Puerto 5432, 8000 y 8001 disponibles en el sistema

### Configuración Inicial

1. **Clonar el repositorio** (si no está hecho):
   ```bash
   git clone <url-del-repositorio>
   cd secure-login-mfa
   ```

2. **Crear archivo .env para la API** (si no existe):
   ```bash
   touch api/.env
   ```

   El archivo `.env` puede estar vacío ya que la configuración de conexión a la base de datos está hardcodeada en `app.js`.

### Levantar los Servicios

Para levantar todos los servicios, ejecutar:

```bash
docker-compose up --build
```

Esta opción construirá las imágenes si no existen y levantará todos los servicios en primer plano.

#### Opciones Adicionales

- **Modo detached (ejecución en segundo plano)**:
  ```bash
  docker-compose up --build -d
  ```

- **Solo construir sin levantar**:
  ```bash
  docker-compose build
  ```

- **Ver logs de todos los servicios**:
  ```bash
  docker-compose logs -f
  ```

- **Ver logs de un servicio específico**:
  ```bash
  docker-compose logs -f backend
  docker-compose logs -f api
  docker-compose logs -f db
  ```

### Servicios Incluidos

#### Base de Datos (db)
- **Imagen**: PostgreSQL 15
- **Puerto**: 5432
- **Credenciales**:
  - Usuario: `umg`
  - Contraseña: `mfa-umg`
  - Base de datos: `postgres`
- **Datos persistentes**: Los datos se almacenan en `./postgres_data`

#### Backend (NestJS)
- **Puerto**: 8000
- **Framework**: NestJS
- **Características**:
  - Autenticación JWT
  - Sistema MFA
  - Prisma ORM
  - Swagger/OpenAPI documentación
- **Proceso de inicio**:
  1. Instala dependencias (`npm install`)
  2. Genera cliente Prisma (`prisma generate`)
  3. Inicia servidor en modo desarrollo (`npm run start:dev`)

#### API (Express.js)
- **Puerto**: 8001
- **Framework**: Express.js
- **Funcionalidad**: Proporciona endpoints REST para consultar productos
- **Endpoints principales**:
  - `GET /` - Obtiene todos los productos
  - `GET /products` - Obtiene todos los productos (alternativo)
- **Proceso de inicio**:
  1. Instala dependencias (`npm install`)
  2. Inicia servidor (`npm run start`)

### Verificación de Servicios

Una vez levantados los servicios, puedes verificar que están funcionando:

1. **Base de datos**:
   ```bash
   docker-compose exec db pg_isready -U umg -d postgres
   ```

2. **Backend**:
   ```bash
   curl http://localhost:8000
   # Debería mostrar información del servicio NestJS
   ```

3. **API**:
   ```bash
   curl http://localhost:8001
   # Debería devolver productos en formato JSON
   ```

### Detener Servicios

Para detener todos los servicios:

```bash
docker-compose down
```

Para detener servicios y eliminar volúmenes (¡cuidado con los datos!):

```bash
docker-compose down -v
```

### Troubleshooting

#### Problemas Comunes

1. **Puerto ocupado**:
   - Verificar que los puertos 5432, 8000 y 8001 estén disponibles
   - Cambiar los puertos en `compose.yml` si es necesario

2. **Base de datos no inicia**:
   - Verificar logs: `docker-compose logs db`
   - Posible problema de permisos en el directorio `./postgres_data`

3. **Dependencias no se instalan**:
   - Los comandos `npm install` están incluidos en los Dockerfiles
   - Verificar conectividad a npm registry

4. **Prisma no genera cliente**:
   - Verificar que el esquema Prisma esté correcto
   - Ver logs del backend: `docker-compose logs backend`

#### Comandos Útiles para Debug

```bash
# Ejecutar comando en contenedor específico
docker-compose exec backend sh
docker-compose exec api sh
docker-compose exec db bash

# Ver estado de contenedores
docker-compose ps

# Ver imágenes creadas
docker-compose images

# Limpiar recursos (si hay problemas)
docker-compose down --rmi all --volumes --remove-orphans
```

### Arquitectura de la Aplicación

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │     API     │
│  (React)    │◄──►│  (NestJS)   │◄──►│ (Express)   │
│             │    │   JWT/MFA   │    │  Products   │
└─────────────┘    └─────────────┘    └─────────────┘
                              │                │
                              │                │
                              ▼                ▼
                       ┌─────────────┐        ┌─────────────┐
                       │ PostgreSQL  │        │ PostgreSQL  │
                       │   Prisma    │        │   Prisma    │
                       └─────────────┘        └─────────────┘
```

**Nota**: El servicio frontend está disponible pero comentado en el archivo `compose.yml`. Para habilitarlo, descomente las líneas correspondientes y ajuste la configuración según sea necesario.