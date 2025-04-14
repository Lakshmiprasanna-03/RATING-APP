import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { classNames } from '../utils/classNames';

const Table = ({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  isLoading = false,
  emptyMessage = 'No data available',
}) => {
  const handleSort = (key) => {
    if (sortBy === key) {
      onSort(key, sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      onSort(key, 'ASC');
    }
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                {column.sortable ? (
                  <button
                    className="group inline-flex items-center"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    <span
                      className={classNames(
                        'ml-2 flex-none rounded',
                        sortBy === column.key ? 'bg-gray-200 text-gray-900' : 'text-gray-400 invisible group-hover:visible'
                      )}
                    >
                      {sortBy === column.key && sortOrder === 'DESC' ? (
                        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-sm text-gray-500"
              >
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                </div>
                <div className="mt-2">Loading...</div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map((column) => (
                  <td
                    key={`${item.id || index}-${column.key}`}
                    className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
