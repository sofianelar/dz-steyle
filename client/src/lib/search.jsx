import { createContext, useContext, useState } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [q, setQ] = useState('');
  return (
    <SearchContext.Provider value={{ q, setQ }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
