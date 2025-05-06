"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TableSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const TableSearch = ({ onSearch, initialQuery = "" }: TableSearchProps) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Auto-search as typing after a brief delay
    if (e.target.value === "") {
      onSearch("");
    }
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) onSearch(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 group focus-within:ring-saberPro-gray transition-all duration-300 hover:ring-gray-400"
    >
      <Search
        size={14}
        className="text-saberPro-gray group-focus-within:scale-110 transition-transform duration-200"
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Buscar..."
        className="w-[200px] p-2 bg-transparent outline-none transition-all duration-200 placeholder:text-gray-400"
      />
      {query && (
        <button
          type="button"
          onClick={clearSearch}
          className="text-gray-400 hover:text-saberPro-gray transition-colors duration-200"
        >
          <X
            size={12}
            className="hover:rotate-90 transition-transform duration-300"
          />
        </button>
      )}
    </form>
  );
};

export default TableSearch;
