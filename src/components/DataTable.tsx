import { useMemo, useState } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => string | number | JSX.Element;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  search?: (row: T) => string;
  emptyMessage: string;
}

export const DataTable = <T,>({ columns, rows, search, emptyMessage }: DataTableProps<T>) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? '');
  const [ascending, setAscending] = useState(false);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const visibleRows = !normalizedQuery || !search ? rows : rows.filter((row) => search(row).toLowerCase().includes(normalizedQuery));
    const column = columns.find((candidate) => candidate.key === sortKey) ?? columns[0];
    if (!column) return visibleRows;
    return [...visibleRows].sort((left, right) => {
      const a = column.sortValue ? column.sortValue(left) : String(column.render(left));
      const b = column.sortValue ? column.sortValue(right) : String(column.render(right));
      if (a === b) return 0;
      const result = a > b ? 1 : -1;
      return ascending ? result : -result;
    });
  }, [ascending, columns, query, rows, search, sortKey]);

  return (
    <div className="table-wrap">
      {search ? (
        <div className="table-toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search or filter…" />
        </div>
      ) : null}
      {filteredRows.length ? (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => {
                      if (sortKey === column.key) {
                        setAscending((current) => !current);
                      } else {
                        setSortKey(column.key);
                        setAscending(false);
                      }
                    }}
                  >
                    {column.header}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state small">{emptyMessage}</div>
      )}
    </div>
  );
};
