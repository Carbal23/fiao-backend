# FIAO Backend

FIAO's API is a Spring Boot 3 application (Java 21, Maven) backed by PostgreSQL. All API routes retain the `/api` prefix. Persistence uses JPA/Hibernate entities and Flyway SQL migrations; Hibernate validates the schema and never creates or updates tables.

## Run locally

Install a JDK 21 and Maven. The project loads `.env.local` by default; environment files are private and ignored by Git. Configure PostgreSQL through `PG_HOST`, `PG_PORT`, `PG_DB`, `PG_USER`, and `PG_PASSWORD`, or provide `SPRING_DATASOURCE_URL` and the matching Spring datasource credentials.

```sh
# Local PostgreSQL
mvn spring-boot:run

# Development database
FIAO_ENV_FILE=.env.development mvn spring-boot:run

# Production database
FIAO_ENV_FILE=.env.production mvn spring-boot:run
```

Set `FIAO_ENV_FILE` to choose the environment when launching either with Maven or the packaged JAR.

Build and run tests:

```sh
mvn clean test
mvn package
java -jar target/fiao-backend-1.0.0.jar
```

## Database and Flyway migrations

`src/main/java/com/fiao/model/` contains the complete persisted model: ten entities, their current fields and relationships, and the eight PostgreSQL enums. `src/main/resources/db/migration/V1__initial_schema.sql` creates the complete final schema for a new, empty database, including the unique `User.documentNumber` index. Flyway applies pending migrations at startup; Hibernate runs with `ddl-auto=validate` and cannot mutate the schema.

For an empty database, start the application normally and Flyway creates the schema. An existing database that already has the matching final schema must be explicitly opted into Flyway baseline once by setting `FIAO_FLYWAY_BASELINE_EXISTING_SCHEMA=true`. Before baselining, startup verifies the required tables/columns, all enum labels, and the `User.documentNumber` unique index; it refuses to baseline mismatched or partial schemas. Do not set this option for an empty database or a schema that has not been fully migrated. Normal startup does not baseline an existing schema. Legacy migration records and application data are not changed; there is no reset, drop, or data-copy step.

The configured development (`postgres`) and production (`postgres_prod`) databases were baselined at version 1 on 2026-10-09 after the compatibility checks passed. Start these environments normally, without `FIAO_FLYWAY_BASELINE_EXISTING_SCHEMA`; future migrations begin at `V2`.

Do not enable Hibernate `create`, `create-drop`, or `update` modes. Add future schema changes as ordered Flyway migrations and update the entity mappings in the same change.

The HTTP/API tests run without a database. Persistence integration tests use an isolated PostgreSQL 16 Testcontainers instance and can be run with:

```sh
mvn -Dtest=PersistenceIntegrationTest test
```

Docker must be available for this integration test.

## API contract

- `GET /api/health` is public and returns `{"status":"ok"}`.
- Interactive API documentation is available at `/swagger-ui/index.html`; its OpenAPI document is at `/v3/api-docs`.
- Routes are implemented in nine module controllers under `src/main/java/com/fiao/api/`, each with its own Swagger tag: Health, Auth, Users, Business, Debtors, Debts, Payments, Business Users, and Invitations. Controllers call their matching domain service directly (`AuthService`, `UsersService`, `BusinessService`, `BusinessUsersService`, `DebtorsService`, `DebtsService`, `PaymentsService`, and `InvitationsService`); there is no all-domain service facade.
- Services persist and query through the Spring Data repositories in `com.fiao.persistence`. Search, filters, ordering, counts, and pagination execute in the database through derived queries or JPQL; response mapping is performed from entities into API-shaped maps. Payment locking and debt-balance aggregates are expressed as repository JPQL queries. Native SQL is not used for application business operations; Flyway migrations and schema metadata checks are the SQL boundary.
- `POST /api/users` registers a user. `POST /api/auth/login`, `/api/auth/refresh`, and `/api/auth/logout` retain the Nest token response fields and refresh-token headers (`x-refresh-token`, optionally `x-device-info`).
- All other user, business, debtor, debt, payment, business-user, and invitation operations require `Authorization: Bearer <access-token>`.
- Business-scoped routes require `x-business-id`. Membership roles are checked against `BusinessUser`; create/edit and payment permissions follow the existing role rules.
- Paginated collections return `{ "data": [...], "meta": { "total", "page", "limit", "totalPages" } }`. `page` defaults to 1 and `limit` to 10 (maximum 100).
- Request validation and application errors return an HTTP error status and `{ "statusCode", "message", "error" }`.

Implemented endpoint families:

| Family | Routes |
| --- | --- |
| Health | `GET /health` |
| Authentication | `POST /auth/login`, `/auth/refresh`, `/auth/logout` |
| Users | `POST /users`, `GET /users`, `/users/:id`, `/users/me/dashboard`, `PATCH /users/:id`, `/users/:id/inactivate` |
| Businesses | `GET`/`POST /business`, `GET`/`PATCH /business/:id`, `PATCH /business/:id/inactivate` |
| Debtors | `GET`/`POST /debtors`, `/debtors/me/all`, `/debtors/summary`, `/debtors/:id`, `PATCH /debtors/:id`, `/debtors/:id/inactivate` |
| Debts | `GET`/`POST /debts`, `/debtors/:debtorId/debts`, `PATCH /debts/:id/status` |
| Payments | `GET`/`POST /payments`, `POST /payments/global`, `POST /payments/global/reverse/:groupId`, `GET /debts/:debtId/payments` |
| Business users | `GET`/`POST /business-users`, `PATCH`/`DELETE /business-users/:id` |
| Invitations | `POST /invitations`, `GET /invitations/:code`, `POST /invitations/accept`, `GET /invitations/business/:businessId` |

## Migration notes

Debt payment calculations and global-payment allocation remain transactional; global payments apply FIFO by debt creation time. Passwords and refresh tokens are BCrypt-hashed, and access tokens are signed JWTs.

Invitation records and codes are created and can be accepted, but this application does not send email/SMS notifications. Invitation delivery therefore needs an explicitly configured provider integration before relying on notification delivery. `AuditLog` is represented in the persisted model; audit write-through is not currently wired.
