/**
 * Publica una versión de un documento legal (términos y condiciones o
 * política de tratamiento de datos) en la base del entorno elegido.
 *
 * Uso:
 *   npm run legal:publish:local -- --type PRIVACY_POLICY --version 2026-10 \
 *     --file legal/privacy-policy/2026-10.md [--url https://...] \
 *     [--published-at 2026-11-01T00:00:00-05:00]
 *
 * Una versión publicada no se modifica: si el archivo cambió, hay que
 * publicarlo con otro número de versión.
 */
const { createHash } = require('crypto');
const { readFileSync } = require('fs');
const { PrismaClient } = require('@prisma/client');

const TYPES = ['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) throw new Error(`Argumento inválido: ${argv[i]}`);
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { type, version, file, url } = args;

  if (!TYPES.includes(type)) {
    throw new Error(`--type debe ser uno de: ${TYPES.join(', ')}`);
  }
  if (!version) throw new Error('Falta --version');
  if (!file) throw new Error('Falta --file');

  // Se normalizan los saltos de línea para que el mismo texto tenga la misma
  // huella en Windows y en Linux.
  const content = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim() + '\n';
  const contentHash = createHash('sha256').update(content).digest('hex');
  const publishedAt = args['published-at'] ? new Date(args['published-at']) : new Date();
  if (Number.isNaN(publishedAt.getTime())) throw new Error('--published-at no es una fecha válida');

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.legalDocument.findUnique({
      where: { type_version: { type, version } },
    });

    if (existing) {
      if (existing.contentHash === contentHash) {
        console.log(`${type} ${version} ya estaba publicado con el mismo texto. Sin cambios.`);
        return;
      }
      throw new Error(
        `${type} ${version} ya existe con otro texto. Una versión publicada no se modifica: usa otro número de versión.`,
      );
    }

    const document = await prisma.legalDocument.create({
      data: { type, version, content, contentHash, url, publishedAt },
    });
    console.log(`Publicado ${type} ${version}`);
    console.log(`  id:          ${document.id}`);
    console.log(`  vigente desde ${document.publishedAt.toISOString()}`);
    console.log(`  sha256:      ${contentHash}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
