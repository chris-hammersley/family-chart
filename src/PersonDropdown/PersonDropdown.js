// PersonDropdown/PersonDropdown.js

/**
 * Person search and selection dropdown with MongoDB integration
 * Provides autocomplete search functionality for family members
 */
class PersonDropdown {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      data: () => [],
      onSelect: null,
      searchFields: ['first name', 'last name'],
      placeholder: 'Search family members...',
      maxResults: 10,
      minSearchLength: 1,
      showAvatars: true,
      groupByFamily: false,
      ...config
    };

    this.isOpen = false;
    this.currentQuery = '';
    this.selectedIndex = -1;
    this.filteredResults = [];
    
    this.init();
  }

  /**
   * Initialize the dropdown
   */
  init() {
    this.createDropdownUI();
    this.attachEventListeners();
  }

  /**
   * Create dropdown UI elements
   */
  createDropdownUI() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'f3-person-dropdown';
    this.dropdown.innerHTML = `
      <div class="f3-dropdown-input-container">
        <input 
          type="text" 
          class="f3-dropdown-input" 
          placeholder="${this.config.placeholder}"
          autocomplete="off"
        >
        <div class="f3-dropdown-icon">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M15.5 15l-4.2-4.2a6.5 6.5 0 1 0-1.4 1.4L14.5 16l1-1zM6.5 1a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z"/>
          </svg>
        </div>
      </div>
      <div class="f3-dropdown-results" style="display: none;">
        <div class="f3-dropdown-list"></div>
      </div>
    `;

    this.container.appendChild(this.dropdown);

    // Store references to key elements
    this.input = this.dropdown.querySelector('.f3-dropdown-input');
    this.results = this.dropdown.querySelector('.f3-dropdown-results');
    this.resultsList = this.dropdown.querySelector('.f3-dropdown-list');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Input events
    this.input.addEventListener('input', (e) => {
      this.currentQuery = e.target.value;
      this.handleSearch();
    });

    this.input.addEventListener('focus', () => {
      if (this.currentQuery.length >= this.config.minSearchLength) {
        this.showResults();
      }
    });

    this.input.addEventListener('blur', (e) => {
      // Delay hiding to allow clicking on results
      setTimeout(() => {
        if (!this.dropdown.contains(document.activeElement)) {
          this.hideResults();
        }
      }, 150);
    });

    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Result click events
    this.resultsList.addEventListener('click', (e) => {
      const resultItem = e.target.closest('.f3-dropdown-item');
      if (resultItem) {
        const personId = resultItem.dataset.personId;
        this.selectPerson(personId);
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target)) {
        this.hideResults();
      }
    });
  }

  /**
   * Handle search input
   */
  handleSearch() {
    if (this.currentQuery.length < this.config.minSearchLength) {
      this.hideResults();
      return;
    }

    this.filteredResults = this.searchPeople(this.currentQuery);
    this.selectedIndex = -1;
    this.renderResults();
    this.showResults();
  }

  /**
   * Search through people data
   */
  searchPeople(query) {
    const data = this.config.data();
    const lowerQuery = query.toLowerCase();
    
    return data
      .filter(person => {
        return this.config.searchFields.some(field => {
          const value = this.getNestedValue(person.data, field);
          return value && value.toLowerCase().includes(lowerQuery);
        });
      })
      .sort((a, b) => {
        // Sort by relevance - exact matches first
        const aRelevance = this.calculateRelevance(a, lowerQuery);
        const bRelevance = this.calculateRelevance(b, lowerQuery);
        return bRelevance - aRelevance;
      })
      .slice(0, this.config.maxResults);
  }

  /**
   * Calculate search relevance score
   */
  calculateRelevance(person, query) {
    let score = 0;
    
    this.config.searchFields.forEach(field => {
      const value = this.getNestedValue(person.data, field);
      if (!value) return;
      
      const lowerValue = value.toLowerCase();
      if (lowerValue === query) {
        score += 100; // Exact match
      } else if (lowerValue.startsWith(query)) {
        score += 50; // Starts with query
      } else if (lowerValue.includes(query)) {
        score += 25; // Contains query
      }
    });
    
    return score;
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Render search results
   */
  renderResults() {
    if (this.filteredResults.length === 0) {
      this.resultsList.innerHTML = `
        <div class="f3-dropdown-empty">
          <div class="f3-empty-icon">👤</div>
          <div class="f3-empty-text">No people found</div>
        </div>
      `;
      return;
    }

    let resultsHtml = '';

    if (this.config.groupByFamily) {
      const grouped = this.groupResultsByFamily();
      for (const [familyName, people] of Object.entries(grouped)) {
        resultsHtml += `<div class="f3-dropdown-group-header">${familyName}</div>`;
        people.forEach((person, index) => {
          resultsHtml += this.renderPersonItem(person, index);
        });
      }
    } else {
      this.filteredResults.forEach((person, index) => {
        resultsHtml += this.renderPersonItem(person, index);
      });
    }

    this.resultsList.innerHTML = resultsHtml;
  }

  /**
   * Render individual person item
   */
  renderPersonItem(person, index) {
    const name = this.getPersonDisplayName(person);
    const details = this.getPersonDetails(person);
    const avatar = this.config.showAvatars ? this.getPersonAvatar(person) : '';
    const isSelected = index === this.selectedIndex ? 'f3-dropdown-item-selected' : '';

    return `
      <div class="f3-dropdown-item ${isSelected}" data-person-id="${person.id}" data-index="${index}">
        <div class="f3-dropdown-item-content">
          ${avatar}
          <div class="f3-dropdown-item-info">
            <div class="f3-dropdown-item-name">${this.highlightMatch(name)}</div>
            <div class="f3-dropdown-item-details">${details}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get person display name
   */
  getPersonDisplayName(person) {
    const firstName = person.data['first name'] || '';
    const lastName = person.data['last name'] || '';
    const name = `${firstName} ${lastName}`.trim();
    return name || person.data.name || 'Unknown Person';
  }

  /**
   * Get person details for display
   */
  getPersonDetails(person) {
    const details = [];
    
    if (person.data.birthday) {
      const birthYear = new Date(person.data.birthday).getFullYear();
      details.push(`Born ${birthYear}`);
    }
    
    if (person.data.profession) {
      details.push(person.data.profession);
    }
    
    if (person.data.location) {
      details.push(person.data.location);
    }

    // Add relationship info if available
    const relationship = this.getRelationshipToMain(person);
    if (relationship) {
      details.push(relationship);
    }
    
    return details.join(' • ') || 'No additional info';
  }

  /**
   * Get person avatar
   */
  getPersonAvatar(person) {
    if (person.data.avatar) {
      return `
        <div class="f3-dropdown-avatar">
          <img src="${person.data.avatar}" alt="${this.getPersonDisplayName(person)}" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="f3-dropdown-avatar-fallback" style="display:none;">
            ${this.getAvatarInitials(person)}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="f3-dropdown-avatar">
          <div class="f3-dropdown-avatar-fallback">
            ${this.getAvatarInitials(person)}
          </div>
        </div>
      `;
    }
  }

  /**
   * Get avatar initials
   */
  getAvatarInitials(person) {
    const firstName = person.data['first name'] || '';
    const lastName = person.data['last name'] || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    return initials || '?';
  }

  /**
   * Get relationship to main person
   */
  getRelationshipToMain(person) {
    // This would integrate with the kinship calculator
    // For now, return basic relationship info
    if (person.rels.father || person.rels.mother) {
      return 'Child';
    }
    if (person.rels.children && person.rels.children.length > 0) {
      return 'Parent';
    }
    if (person.rels.spouses && person.rels.spouses.length > 0) {
      return 'Married';
    }
    return '';
  }

  /**
   * Group results by family name
   */
  groupResultsByFamily() {
    const grouped = {};
    
    this.filteredResults.forEach(person => {
      const familyName = person.data['last name'] || 'Other';
      if (!grouped[familyName]) {
        grouped[familyName] = [];
      }
      grouped[familyName].push(person);
    });
    
    return grouped;
  }

  /**
   * Highlight search matches in text
   */
  highlightMatch(text) {
    if (!this.currentQuery) return text;
    
    const regex = new RegExp(`(${this.escapeRegExp(this.currentQuery)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape regex special characters
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(e) {
    if (!this.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredResults.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.filteredResults[this.selectedIndex]) {
          this.selectPerson(this.filteredResults[this.selectedIndex].id);
        }
        break;
        
      case 'Escape':
        this.hideResults();
        this.input.blur();
        break;
    }
  }

  /**
   * Update visual selection
   */
  updateSelection() {
    const items = this.resultsList.querySelectorAll('.f3-dropdown-item');
    
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('f3-dropdown-item-selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('f3-dropdown-item-selected');
      }
    });
  }

  /**
   * Select a person
   */
  selectPerson(personId) {
    const person = this.config.data().find(p => p.id === personId);
    if (!person) return;

    // Update input with selected person's name
    this.input.value = this.getPersonDisplayName(person);
    this.hideResults();

    // Call selection callback
    if (this.config.onSelect) {
      this.config.onSelect(personId, person);
    }

    // Dispatch custom event
    const event = new CustomEvent('person-selected', {
      detail: { personId, person }
    });
    this.dropdown.dispatchEvent(event);
  }

  /**
   * Show results dropdown
   */
  showResults() {
    this.isOpen = true;
    this.results.style.display = 'block';
    this.dropdown.classList.add('f3-dropdown-open');
  }

  /**
   * Hide results dropdown
   */
  hideResults() {
    this.isOpen = false;
    this.results.style.display = 'none';
    this.dropdown.classList.remove('f3-dropdown-open');
    this.selectedIndex = -1;
  }

  /**
   * Clear the search input
   */
  clear() {
    this.input.value = '';
    this.currentQuery = '';
    this.hideResults();
  }

  /**
   * Set the search value programmatically
   */
  setValue(value) {
    this.input.value = value;
    this.currentQuery = value;
    if (value) {
      this.handleSearch();
    }
  }

  /**
   * Get current search value
   */
  getValue() {
    return this.input.value;
  }

  /**
   * Focus the search input
   */
  focus() {
    this.input.focus();
  }

  /**
   * Enable or disable the dropdown
   */
  setEnabled(enabled) {
    this.input.disabled = !enabled;
    if (!enabled) {
      this.hideResults();
    }
  }

  /**
   * Update the data source
   */
  updateData(newDataFunction) {
    this.config.data = newDataFunction;
    if (this.currentQuery) {
      this.handleSearch();
    }
  }

  /**
   * Destroy the dropdown
   */
  destroy() {
    this.dropdown.remove();
  }
}

export default PersonDropdown;