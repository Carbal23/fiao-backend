type FindManyArgs<W> = {
  where?: W;
  orderBy?: any;
  include?: any;
  select?: any;
  skip?: number;
  take?: number;
};

type CountArgs<W> = {
  where?: W;
};

type Delegate<W, R> = {
  findMany(args: FindManyArgs<W>): Promise<R[]>;
  count(args: CountArgs<W>): Promise<number>;
};

interface PaginateOptions {
  page?: number;
  limit?: number;
}

export async function paginate<W, R>(
  model: Delegate<W, R>,
  args: Omit<FindManyArgs<W>, 'skip' | 'take'>,
  options: PaginateOptions = {},
) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      ...args,
      skip,
      take: limit,
    }),
    model.count({
      where: args.where,
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
