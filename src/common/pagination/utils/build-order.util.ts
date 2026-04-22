export function buildOrder(sortBy?: string, order?: 'asc' | 'desc') {
  if (!sortBy) return { createdAt: 'desc' };

  return {
    [sortBy]: order ?? 'desc',
  };
}
