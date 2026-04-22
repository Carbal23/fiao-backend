export function buildWhere({
  search,
  searchFields = [],
  filters = {},
}: {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
}) {
  const where: Record<string, any> = { ...filters };

  if (search && searchFields.length) {
    where.OR = searchFields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    }));
  }

  return where;
}
