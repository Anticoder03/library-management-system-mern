export const sendSuccess = (res, { data = null, message, meta, status = 200 }) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

export const getPagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export const buildSort = (sort = '', allowed = [], defaultSort = '-createdAt') => {
  const fields = String(sort)
    .split(',')
    .map((field) => field.trim())
    .filter((field) => {
      const name = field.replace(/^-/, '');
      return allowed.includes(name);
    });
  return fields.length ? fields.join(' ') : defaultSort;
};
