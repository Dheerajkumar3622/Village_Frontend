import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface Village {
  name: string;
  subDistrict: string;
  district: string;
}

interface Props {
  label: string;
  onSelect: (village: Village) => void;
  disabled?: boolean;
}

export const LocationSelector: React.FC<Props> = ({
  label,
  onSelect,
  disabled = false
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Village[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/villages/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  return (
    <div ref={ref} className="relative space-y-2">
      <label className="text-xs font-bold uppercase text-slate-500">
        {label}
      </label>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

        <input
          value={query}
          disabled={disabled}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Type village name..."
          className="w-full pl-10 pr-4 py-3 border rounded-xl"
        />

        {open && (
          <div className="absolute z-[9999] mt-2 w-full bg-white border rounded-xl shadow max-h-64 overflow-y-auto">
            {loading && (
              <div className="p-3 text-sm text-slate-400">
                Searching…
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="p-3 text-sm text-slate-400">
                No village found
              </div>
            )}

            {results.map((v, i) => (
              <div
                key={i}
                onMouseDown={() => {
                  setQuery(v.name);
                  setOpen(false);
                  onSelect(v);
                }}
                className="px-4 py-3 cursor-pointer hover:bg-slate-100"
              >
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-slate-500">
                  {v.subDistrict}, {v.district}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
