-- Los refresh tokens pasan de guardarse con bcrypt a SHA-256, y se buscan
-- directamente por su hash. Los existentes (bcrypt) ya no pueden validarse,
-- así que se eliminan: cada usuario tendrá que iniciar sesión una vez.
DELETE FROM "RefreshToken";

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
