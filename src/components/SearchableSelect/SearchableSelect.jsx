import React, { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label,
  name,
  unit 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div className="select-input-wrapper">
        <input
          type="text"
          value={isOpen ? searchTerm : value || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          placeholder={placeholder}
          className="select-input"
        />
        <span className="material-icons dropdown-icon">
          {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
        </span>
      </div>
      
      {isOpen && (
        <ul className="options-list">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="option-item"
            >
              {option} {unit && <span className="unit">({unit})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect; 