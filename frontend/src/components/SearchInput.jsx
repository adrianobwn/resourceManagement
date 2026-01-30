import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({
    value,
    onChange,
    placeholder = "Search...",
    width = "w-80",
    className = ""
}) => {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`pl-10 pr-4 py-2 ${width} bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] font-medium ${className}`}
            />
        </div>
    );
};

export default SearchInput;
