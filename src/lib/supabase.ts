// Client-side Supabase compatibility layer
// All DB operations go through API endpoints

const API_BASE = '/api';

// Types
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
  count?: number | null;
};

type QueryOrder = { ascending: boolean };
type OrderDirection = 'asc' | 'desc';

type SelectOptions = {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
};

// Guitar-tabs API
export const supabase = {
  from(table: string) {
    if (table === 'guitar-tabs') {
      return {
        select: (optionsOrFields?: string | SelectOptions, options?: SelectOptions) => {
          let publishedOnly: boolean | null = null;
          let orderBy: { column?: string; direction?: OrderDirection } = {};
          let limitValue: number | undefined;
          let singleResult = false;

          // Handle both select('*') and select({ count: 'exact', head: true })
          const selectOptions = typeof optionsOrFields === 'object' ? optionsOrFields : options || {};
          const countOnly = selectOptions.count === 'exact' || selectOptions.head === true;

          const executor = {
            order(column: string, options: QueryOrder) {
              orderBy = {
                column,
                direction: options.ascending ? 'asc' : 'desc',
              };
              return {
                limit: (n: number) => {
                  limitValue = n;
                  return {
                    then: (resolve: (value: SupabaseResponse<unknown[]>) => void) => {
                      fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve);
                    },
                  };
                },
                single: () => {
                  singleResult = true;
                  return {
                    then: (resolve: (value: SupabaseResponse<unknown>) => void) => {
                      fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve as (value: SupabaseResponse<unknown[]>) => void);
                    },
                  };
                },
                then: (resolve: (value: SupabaseResponse<unknown[]>) => void) => {
                  fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve);
                },
              };
            },
            eq(column: string, value: unknown) {
              if (column === 'is_published') {
                publishedOnly = value === true;
              }
              return {
                order: (column: string, options: QueryOrder) => {
                  orderBy = {
                    column,
                    direction: options.ascending ? 'asc' : 'desc',
                  };
                  return {
                    limit: (n: number) => {
                      limitValue = n;
                      return {
                        then: (resolve: (value: SupabaseResponse<unknown[]>) => void) => {
                          fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve);
                        },
                      };
                    },
                    single: () => {
                      singleResult = true;
                      return {
                        then: (resolve: (value: SupabaseResponse<unknown>) => void) => {
                          fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve as (value: SupabaseResponse<unknown[]>) => void);
                        },
                      };
                    },
                    then: (resolve: (value: SupabaseResponse<unknown[]>) => void) => {
                      fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve);
                    },
                  };
                },
                single: () => {
                  singleResult = true;
                  return {
                    then: (resolve: (value: SupabaseResponse<unknown>) => void) => {
                      fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve as (value: SupabaseResponse<unknown[]>) => void);
                    },
                  };
                },
                then: (resolve: (value: SupabaseResponse<unknown[]>) => void) => {
                  fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve);
                },
              };
            },
            single: () => {
              singleResult = true;
              return {
                then: (resolve: (value: SupabaseResponse<unknown>) => void) => {
                  fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve as (value: SupabaseResponse<unknown[]>) => void);
                },
              };
            },
            then: (resolve: (value: SupabaseResponse<unknown[]>) => void) => {
              fetchTabs(publishedOnly, orderBy, limitValue, countOnly, singleResult).then(resolve);
            },
          };

          return executor;
        },
      };
    }
    throw new Error(`Table ${table} not implemented`);
  },
};

async function fetchTabs(
  publishedOnly: boolean | null,
  orderBy: { column?: string; direction?: OrderDirection },
  limit?: number,
  countOnly: boolean = false,
  singleResult: boolean = false,
): Promise<SupabaseResponse<unknown[]>> {
  try {
    const params = new URLSearchParams();

    // Use admin endpoint for drafts (is_published = false)
    const isDrafts = publishedOnly === false;
    const endpoint = isDrafts ? `${API_BASE}/admin/tabs` : `${API_BASE}/tabs`;

    if (publishedOnly === true) params.set('published', 'true');
    if (isDrafts) params.set('drafts', 'true');
    if (countOnly) params.set('count', 'true');
    if (singleResult) params.set('single', 'true');
    if (orderBy.column) params.set('order', orderBy.column);
    if (orderBy.direction) params.set('dir', orderBy.direction);
    if (limit) params.set('limit', limit.toString());

    const res = await fetch(`${endpoint}?${params.toString()}`);
    const data = await res.json();

    if (countOnly) {
      return {
        data: [],
        count: data.count ?? null,
        error: null,
      };
    }

    if (singleResult) {
      return {
        data: Array.isArray(data) ? (data[0] || null) : (data || null),
        error: null,
      };
    }

    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (error) {
    console.error('fetchTabs error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}
