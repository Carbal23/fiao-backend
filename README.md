# 💸 FIAO Backend (MVP)

## 🧩 Descripción general

**FIAO Backend** es el servidor principal del **MVP de FIAO**, una aplicación diseñada para gestionar **deudas, pagos y relaciones entre negocios y clientes (deudores)**.  
El sistema permite que cada **usuario o negocio** registre deudas, lleve control de pagos, gestione invitaciones, registre empleados y mantenga trazabilidad de las operaciones.

Este backend está desarrollado con **NestJS** y **Prisma ORM**, y se conecta a una base de datos **PostgreSQL** (tanto local como en Supabase).  
Se ha estructurado pensando en escalabilidad, modularidad y despliegue flexible para entornos **local**, **development** y **production**.

---

## ⚙️ Tecnologías principales

| Tecnología | Descripción |
|-------------|-------------|
| **NestJS** | Framework de Node.js con arquitectura modular y soporte completo para inyección de dependencias. |
| **Prisma ORM** | ORM moderno para bases de datos SQL, facilita migraciones, tipado y consultas seguras. |
| **PostgreSQL** | Motor de base de datos principal del proyecto. |
| **Supabase** | Usado como servicio de base de datos remoto (con conexión vía *pooling* y *direct*). |
| **dotenv-cli** | Carga automática de archivos `.env` según el entorno. |
| **cross-env** | Establece variables de entorno en scripts de forma portable. |
| **bcrypt / JWT / Passport** | Autenticación segura basada en tokens. |

---

## 🧱 Estructura de modelos Prisma

La base de datos se modela con Prisma ORM. A continuación se describe brevemente el propósito de cada modelo principal:

### 👤 `User`
Representa un usuario dentro del sistema.  
Puede ser **propietario de negocios**, **empleado**, o **cliente/deudor**.  
También lleva trazabilidad de quién crea deudas o pagos.

### 🏢 `Business`
Negocio o empresa registrada dentro del sistema.  
Cada negocio pertenece a un **usuario propietario (`owner`)** y puede tener múltiples **empleados (`BusinessUser`)**, **deudas**, **deudores** e **invitaciones**.

### 👥 `BusinessUser`
Define la relación entre usuarios y negocios.  
Permite roles dentro del negocio (`ADMIN`, `CASHIER`, `VIEWER`) y mantiene integridad entre ambos.

### 💰 `Debt`
Representa una deuda registrada por un negocio hacia un deudor.  
Incluye montos, balance actual, estado (`OPEN`, `PAID`, `CANCELLED`), y la relación con quien la creó.

### 🧾 `Payment`
Registra pagos parciales o totales realizados sobre una deuda.  
Asociado al usuario que lo crea y al método de pago (`CASH`, `TRANSFER`, etc).

### 🙋‍♂️ `Debtor`
Persona (cliente o tercero) asociada a un negocio con deudas activas o pagadas.  
Puede ser también un `User` del sistema si fue invitado y se registró.

### ✉️ `Invitation`
Permite invitar a deudores o usuarios a un negocio mediante **correo o teléfono**.  
Cada invitación tiene un código único y un estado (`PENDING`, `ACCEPTED`, `EXPIRED`).

### 🕵️ `AuditLog`
Registra acciones dentro del sistema para trazabilidad: quién hizo qué, sobre qué entidad y cuándo.

---

## 🧠 Flujo de entornos y configuración

El proyecto se maneja mediante tres entornos:

| Entorno | Archivo `.env` | Uso principal |
|----------|----------------|----------------|
| **Local** | `.env.local` | Desarrollo local con base de datos PostgreSQL local. |
| **Development** | `.env.development` | Entorno de desarrollo conectado a Supabase (con *directUrl* para migraciones). |
| **Production** | `.env.production` | Entorno productivo conectado a Supabase (solo *DATABASE_URL* con pooling). |

---

## 🧾 Ejemplo de variables de entorno

### 🔹 `.env.local`
```env
NODE_ENV=local
PORT=3000

# PostgreSQL local
PG_USER=postgres
PG_PASSWORD=postgres
PG_DB=fiao_db
PG_HOST=localhost
PG_PORT=5432

# Prisma URLs
DATABASE_URL=postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public
DIRECT_URL=${DATABASE_URL}

# JWT
JWT_SECRET="local_secret_key"
JWT_EXPIRES_IN="1d"
```

### 🔹 `.env.development`
```env
NODE_ENV=development
PORT=3000

# Supabase (pooler)
DATABASE_URL="postgresql://user:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (migrations)
DIRECT_URL="postgresql://user:pass@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

JWT_SECRET="dev_secret_key"
JWT_EXPIRES_IN="1d"
```

### 🔹 `.env.production`
```env
NODE_ENV=production
PORT=3000

# Supabase (pooling only)
DATABASE_URL="postgresql://user:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

JWT_SECRET="prod_secret_key"
JWT_EXPIRES_IN="1d"
```

---

## 🗃️ Prisma y base de datos

### 📦 Configuración en `schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Esto permite usar:
- `DATABASE_URL` → conexión normal (pooling)
- `DIRECT_URL` → conexión directa (para migraciones o seeds)

---

## 🧭 Prisma Service

Archivo: `src/prisma/prisma.service.ts`
```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url:
            configService.get<string>('database.directUrl') ||
            configService.get<string>('database.url'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Conectado a la base de datos.');
    console.log('🌍 NODE_ENV:', this.configService.get<string>('app.nodeEnv'));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 🧰 Scripts útiles

### 🚀 Inicio de servidor
| Script | Descripción |
|---------|-------------|
| `npm run start:local` | Inicia servidor con `.env.local`. |
| `npm run start:dev` | Inicia con `.env.development`. |
| `npm run start:prod` | Ejecuta versión compilada (`dist`) en producción. |

---

### 🧱 Migraciones Prisma
| Script | Descripción |
|---------|-------------|
| `npm run migrate:dev` | Crea/aplica migraciones en entorno de desarrollo (Supabase directo). |
| `npm run migrate:deploy` | Aplica migraciones aprobadas en producción. |
| `npm run db:push:local` | Sin migraciones: sincroniza schema local directamente a BD local. |

> ⚠️ **Importante:**  
> - Se recomienda manejar migraciones solo en **development** y **production**.  
> - En local se usa `db push` para desarrollo rápido.  
> - Las migraciones se consideran **“aprobadas”** cuando han sido testeadas en development y están listas para deploy en producción.

---

## 📁 Scripts en `package.json`

```json
"scripts": {
  "start:local": "dotenv -e .env.local -- cross-env NODE_ENV=local nest start --watch",
  "start:dev": "dotenv -e .env.development -- cross-env NODE_ENV=development nest start --watch",
  "start:prod": "cross-env NODE_ENV=production node dist/main",
  "db:push:local": "dotenv -e .env.local -- prisma db push",
  "migrate:dev": "dotenv -e .env.development -- prisma migrate dev",
  "migrate:deploy": "dotenv -e .env.production -- prisma migrate deploy",
  "generate": "npx prisma generate"
}
```

---

## 🧩 Flujo de trabajo con Prisma

1. **Modificar `schema.prisma`**  
   Añade o cambia modelos según necesidad.

2. **Crear migración (solo development):**
   ```bash
   npm run migrate:dev -- --name add-new-model
   ```

3. **Verificar en Supabase (development)**  
   Revisa los cambios y testea la nueva estructura.

4. **Deploy de migraciones aprobadas (producción):**
   ```bash
   npm run migrate:deploy
   ```

5. **Para local:**  
   Usa `npm run db:push:local` para aplicar el schema sin crear migraciones.

---

## 🧩 Dependencias clave

- `@nestjs/common`, `@nestjs/core`, `@nestjs/config` → estructura principal de NestJS
- `@prisma/client`, `prisma` → ORM y cliente de base de datos
- `bcrypt`, `jsonwebtoken`, `passport-jwt` → autenticación y seguridad
- `dotenv-cli`, `cross-env` → manejo de entornos
- `typescript`, `ts-node` → desarrollo en TypeScript

---

## 🧑‍💻 Autor

**Equipo FIAO**  
Desarrollado por [Mauricio Carbal](#) 🧠  
Con arquitectura y flujo diseñados para escalar hacia futuras integraciones.

---

## 🚀 Estado del proyecto

> **MVP en desarrollo.**  
> Soporta:
> - Autenticación básica
> - Registro de negocios, usuarios y deudas
> - Pagos e invitaciones
> - Entornos configurables (local/dev/prod)
> - Integración con Supabase como DB remota

---

## 🧩 Próximos pasos

- [ ] Implementar auditoría avanzada (`AuditLog`)
- [ ] Endpoints para gestión de roles dentro de negocios
- [ ] Integrar cacheo selectivo (Redis o similar)
- [ ] Publicar documentación de API con Swagger

---

### 🧡 Contribuye
Si deseas colaborar:
```bash
git clone https://github.com/tu-repo/fiao-backend.git
cd fiao-backend
npm install
npm run start:local
```

---

✨ **FIAO Backend** — un sistema simple, modular y listo para escalar 🚀
