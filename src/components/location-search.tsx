'use client';

import { AlertCircle, Loader2, Search } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { searchLocations } from '@/lib/osm/client';
import type { OSMSearchResult } from '@/lib/osm/types';
import { cn } from '@/lib/utils';

export interface LocationSearchProps {
  /** City name for search filtering */
  cityName: string;
  /** Callback when a result is selected */
  onSelect: (result: OSMSearchResult) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Custom className */
  className?: string;
}

/**
 * Location Search Component
 *
 * Features:
 * - Debounced search input
 * - Results limited to city
 * - Error handling and states
 * - Keyboard navigation (arrow keys, enter)
 * - Accessible dropdown
 */
export const LocationSearch = React.forwardRef<HTMLDivElement, LocationSearchProps>(
  function LocationSearch(
    { cityName, onSelect, placeholder = 'Search address...', className },
    ref
  ) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<OSMSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Handle search with debounce
    const performSearch = useCallback(
      async (q: string) => {
        if (!q.trim()) {
          setResults([]);
          setError(null);
          return;
        }

        setIsLoading(true);
        setError(null);
        setSelectedIndex(-1);

        try {
          const searchResults = await searchLocations(q, cityName, 8);
          setResults(searchResults);
          if (searchResults.length === 0) {
            setError('No locations found');
          }
        } catch (err) {
          // Use console.warn to avoid triggering Next.js error overlay for expected errors
          console.warn(
            '[Location Search] Failed to search:',
            err instanceof Error ? err.message : String(err)
          );
          setError('Failed to search locations');
          toast.error('Search Failed', {
            description:
              'Unable to search for locations. Please check your connection and try again.',
            duration: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      },
      [cityName]
    );

    // Setup debounce timer for search input
    useEffect(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [query, performSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          inputRef.current &&
          dropdownRef.current &&
          !inputRef.current.contains(e.target as Node) &&
          !dropdownRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < results.length) {
              handleSelectResult(results[selectedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            break;
          default:
            break;
        }
      },
      [isOpen, results, selectedIndex]
    );

    const handleSelectResult = (result: OSMSearchResult) => {
      setQuery('');
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      onSelect(result);
    };

    return (
      <div ref={ref} className={cn('relative w-full', className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(query.length > 0)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-3"
            aria-autocomplete="list"
            aria-controls="location-search-results"
            aria-expanded={isOpen && results.length > 0}
            aria-label="Search locations"
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results dropdown */}
        {isOpen && (results.length > 0 || error) && (
          <div
            ref={dropdownRef}
            id="location-search-results"
            className="absolute top-full left-0 right-0 mt-1 bg-popover border border-input rounded-lg shadow-lg z-50"
            role="listbox"
          >
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {results.length > 0 && (
              <ul className="max-h-[300px] overflow-y-auto">
                {results.map((result, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <li key={`${result.osm_id}-${result.osm_type}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm transition-colors',
                          isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="font-medium line-clamp-1">{result.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {result.display_name}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
);

LocationSearch.displayName = 'LocationSearch';
