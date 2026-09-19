-- Columna de búsqueda normalizada para deudores.
--
-- PostgreSQL con `mode: 'insensitive'` (ILIKE) ignora mayúsculas pero no las
-- tildes, así que buscar "jose" no encontraba a "José". Se guarda una copia
-- del nombre, el teléfono y el documento en minúsculas y sin tildes, y la
-- búsqueda pasa a hacerse sobre esa única columna en vez de tres OR.

-- AlterTable
ALTER TABLE "Debtor" ADD COLUMN "searchText" TEXT;

-- Relleno de las filas existentes.
--
-- `translate` se usa en vez de la extensión `unaccent` para no exigir permisos
-- de superusuario en la base de datos gestionada.
--
-- El mapa tiene que producir exactamente lo mismo que el `normalizeSearch` de
-- DebtorsService, que usa `normalize('NFD')` y descarta los diacríticos
-- combinantes. Si divergen, las filas viejas (normalizadas aquí) y las nuevas
-- (normalizadas en la aplicación) se buscarían de forma distinta: un "Zoë"
-- creado antes de esta migración sería inencontrable tecleando "zoe", y solo
-- se arreglaría al editar ese deudor.
--
-- Por eso, además del español y el portugués, van las diéresis de otras
-- lenguas (ä ë ï ö ÿ) y la 'å': NFD también las descompone. La 'ø' queda
-- fuera a propósito — NFD no la descompone porque es una letra por derecho
-- propio, no una 'o' con diacrítico, así que quitarle el trazo aquí
-- introduciría justo la divergencia que este mapa intenta evitar.
UPDATE "Debtor"
SET "searchText" = translate(
  lower(concat_ws(' ', "name", "phone", "documentNumber")),
  'áéíóúüñàèìòùâêîôãõçäëïöÿå',
  'aeiouunaeiouaeioaocaeioya'
);
