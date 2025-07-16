import CalculateTree from "./CalculateTree/CalculateTree.js"
import createStore from "./createStore.js"
import view from "./view/view.js"
import createSvg from "./view/view.svg.js"
import * as handlers from './handlers.js'
import * as elements from './elements.js'
import * as htmlHandlers from './view/view.html.handlers.js'
import * as icons from './view/elements/Card.icons.js'
import createChart from './createChart.js'

import CardSvg from './Cards/CardSvg.js'
import CardHtml from './Cards/CardHtml.js'
import FamilyApi from './api/familyApi.js'
import TreeEditor from './TreeEditor/TreeEditor.js'
import PersonDropdown from './PersonDropdown/PersonDropdown.js'
import FormBuilder from './Forms/FormBuilder.js'
import KinshipCalculator from './Utils/KinshipCalculator.js'

/**
 * Enhanced createChart function with API support and advanced methods
 * @param {string|HTMLElement} cont - Container element or selector
 * @param {Array} data - Initial family data (optional if using API)
 * @param {Object} config - Configuration options
 * @param {Object} config.apiConfig - API configuration
 * @param {string} config.apiConfig.baseUrl - API base URL
 * @param {string} config.apiConfig.familyId - Family identifier
 * @param {Object} config.apiConfig.headers - Additional headers
 * @param {boolean} config.autoSave - Enable auto-save to API
 * @param {number} config.node_separation - Horizontal spacing between nodes
 * @param {number} config.level_separation - Vertical spacing between levels
 * @param {number} config.transition_time - Animation duration
 * @returns {Object} Enhanced chart instance with API methods
 */
function createChartWithApi(cont, data, config = {}) {
  const chart = createChart(cont, data);
  
  // Initialize advanced components
  chart._treeEditor = null;
  chart._personDropdown = null;
  chart._formBuilder = null;
  chart._kinshipCalculator = new KinshipCalculator();
  chart._beforeUpdateCallbacks = [];
  chart._afterUpdateCallbacks = [];
  
  if (config.apiConfig) {
    chart.api = new FamilyApi(config.apiConfig);
    
    /**
     * Load family data from API
     * @param {string} familyId - Optional family ID override
     * @returns {Promise<Array>} Family data
     */
    chart.loadFromApi = async function(familyId) {
      try {
        if (familyId) this.api.setFamilyId(familyId);
        const data = await this.api.fetchFamily();
        this.updateData(data);
        this.updateTree({ initial: true });
        return data;
      } catch (error) {
        console.error('Failed to load from API:', error);
        throw error;
      }
    };
    
    /**
     * Save current family data to API
     * @returns {Promise<boolean>} Success status
     */
    chart.saveToApi = async function() {
      try {
        const currentData = this.store.getData();
        await this.api.saveFamily(currentData);
        return true;
      } catch (error) {
        console.error('Failed to save to API:', error);
        throw error;
      }
    };
    
    /**
     * Update API configuration
     * @param {Object} apiConfig - New API configuration
     * @returns {Object} Chart instance
     */
    chart.setApiConfig = function(apiConfig) {
      this.api = new FamilyApi(apiConfig);
      return this;
    };
    
    // Auto-save functionality
    if (config.autoSave) {
      const originalUpdateData = chart.updateData.bind(chart);
      chart.updateData = function(data) {
        originalUpdateData(data);
        if (config.autoSave) {
          setTimeout(() => this.saveToApi().catch(console.error), 1000);
        }
        return this;
      };
    }
  }

  // ============================================================================
  // ADVANCED METHOD 1: Tree Manipulation Methods
  // ============================================================================
  
  /**
   * Update main person in tree and save to MongoDB
   * @param {Object} datum - Person data object
   * @returns {Promise<Object>} Chart instance
   */
  chart.updateMain = async function(datum) {
    try {
      // Execute before update callbacks
      this._beforeUpdateCallbacks.forEach(callback => callback(datum));
      
      this.store.updateMainId(datum.data ? datum.data.id : datum.id);
      this.store.updateTree({});
      
      // Save to MongoDB if API is configured
      if (this.api) {
        await this.saveToApi();
      }
      
      // Execute after update callbacks
      this._afterUpdateCallbacks.forEach(callback => callback(datum));
      
      return this;
    } catch (error) {
      console.error('Failed to update main person:', error);
      throw error;
    }
  };

  /**
   * Change main person by ID and save to MongoDB
   * @param {string} personId - Person identifier
   * @returns {Promise<Object>} Chart instance
   */
  chart.updateMainId = async function(personId) {
    try {
      const person = this.store.getDatum(personId);
      if (!person) {
        throw new Error(`Person with ID ${personId} not found`);
      }
      
      return await this.updateMain(person);
    } catch (error) {
      console.error('Failed to update main person by ID:', error);
      throw error;
    }
  };

  /**
   * Get current main person
   * @returns {Object} Main person data
   */
  chart.getMainDatum = function() {
    return this.store.getMainDatum();
  };

  /**
   * Add callback to execute before tree updates
   * @param {Function} callback - Callback function
   * @returns {Object} Chart instance
   */
  chart.setBeforeUpdate = function(callback) {
    if (typeof callback === 'function') {
      this._beforeUpdateCallbacks.push(callback);
    }
    return this;
  };

  /**
   * Add callback to execute after tree updates
   * @param {Function} callback - Callback function
   * @returns {Object} Chart instance
   */
  chart.setAfterUpdate = function(callback) {
    if (typeof callback === 'function') {
      this._afterUpdateCallbacks.push(callback);
    }
    return this;
  };

  // ============================================================================
  // ADVANCED METHOD 2: Tree Configuration Methods
  // ============================================================================
  
  /**
   * Set custom function for sorting children
   * @param {Function} sortFunction - Custom sort function
   * @returns {Object} Chart instance
   */
  chart.setSortChildrenFunction = function(sortFunction) {
    this.store.state.sortChildrenFunction = sortFunction;
    return this;
  };

  /**
   * Set custom function for sorting spouses
   * @param {Function} sortFunction - Custom sort function
   * @returns {Object} Chart instance
   */
  chart.setSortSpousesFunction = function(sortFunction) {
    this.store.state.sortSpousesFunction = sortFunction;
    return this;
  };

  /**
   * Set maximum ancestor levels to display
   * @param {number} depth - Maximum ancestry depth
   * @returns {Object} Chart instance
   */
  chart.setAncestryDepth = function(depth) {
    this.store.state.ancestry_depth = depth;
    return this;
  };

  /**
   * Set maximum descendant levels to display
   * @param {number} depth - Maximum progeny depth
   * @returns {Object} Chart instance
   */
  chart.setProgenyDepth = function(depth) {
    this.store.state.progeny_depth = depth;
    return this;
  };

  /**
   * Enable/disable duplicate branch handling
   * @param {boolean} enabled - Toggle duplicate branch handling
   * @returns {Object} Chart instance
   */
  chart.setDuplicateBranchToggle = function(enabled) {
    this.store.state.duplicate_branch_toggle = enabled;
    return this;
  };

  /**
   * Set animation transition time
   * @param {number} time - Transition time in milliseconds
   * @returns {Object} Chart instance
   */
  chart.setTransitionTime = function(time) {
    this.transition_time = time;
    return this;
  };

  /**
   * Calculate maximum tree depth for a person
   * @param {string} personId - Person identifier
   * @returns {Object} Object with ancestry and progeny depths
   */
  chart.getMaxDepth = function(personId) {
    const data = this.store.getData();
    const person = data.find(p => p.id === personId);
    
    if (!person) return { ancestry: 0, progeny: 0 };
    
    // Calculate ancestry depth
    const getAncestryDepth = (person, depth = 0) => {
      const father = person.rels.father ? data.find(p => p.id === person.rels.father) : null;
      const mother = person.rels.mother ? data.find(p => p.id === person.rels.mother) : null;
      
      const fatherDepth = father ? getAncestryDepth(father, depth + 1) : depth;
      const motherDepth = mother ? getAncestryDepth(mother, depth + 1) : depth;
      
      return Math.max(fatherDepth, motherDepth);
    };
    
    // Calculate progeny depth
    const getProgenyDepth = (person, depth = 0) => {
      if (!person.rels.children || person.rels.children.length === 0) return depth;
      
      const childDepths = person.rels.children.map(childId => {
        const child = data.find(p => p.id === childId);
        return child ? getProgenyDepth(child, depth + 1) : depth;
      });
      
      return Math.max(...childDepths);
    };
    
    return {
      ancestry: getAncestryDepth(person),
      progeny: getProgenyDepth(person)
    };
  };

  // ============================================================================
  // ADVANCED METHOD 3: Interactive Editing Methods
  // ============================================================================
  
  /**
   * Enable interactive tree editing mode
   * @param {Object} config - Editor configuration
   * @returns {Object} Tree editor instance
   */
  chart.editTree = function(config = {}) {
    if (!this._treeEditor) {
      this._treeEditor = new TreeEditor(this.cont, this.store, {
        api: this.api,
        onPersonAdd: async (personData) => {
          if (this.api) {
            try {
              const result = await this.api.addPerson(personData);
              this.updateData(await this.api.fetchFamily());
              this.updateTree({});
              return result;
            } catch (error) {
              console.error('Failed to add person via API:', error);
              throw error;
            }
          }
        },
        onPersonUpdate: async (personId, personData) => {
          if (this.api) {
            try {
              const result = await this.api.updatePerson(personId, personData);
              this.updateData(await this.api.fetchFamily());
              this.updateTree({});
              return result;
            } catch (error) {
              console.error('Failed to update person via API:', error);
              throw error;
            }
          }
        },
        onPersonDelete: async (personId) => {
          if (this.api) {
            try {
              const result = await this.api.deletePerson(personId);
              this.updateData(await this.api.fetchFamily());
              this.updateTree({});
              return result;
            } catch (error) {
              console.error('Failed to delete person via API:', error);
              throw error;
            }
          }
        },
        ...config
      });
    }
    return this._treeEditor;
  };

  /**
   * Calculate kinship relationships for a person
   * @param {string} personId - Person identifier
   * @param {Object} options - Calculation options
   * @returns {Object} Kinship data
   */
  chart.calculateKinships = function(personId, options = {}) {
    const data = this.store.getData();
    return this._kinshipCalculator.calculate(personId, data, options);
  };

  /**
   * Get relationship data for kinship analysis
   * @param {Object} person - Person object
   * @param {Object} targetPerson - Target person for relationship calculation
   * @returns {Object} Kinship analysis data
   */
  chart.getKinshipsDataStash = function(person, targetPerson) {
    const data = this.store.getData();
    const kinships = this.calculateKinships(person.id);
    
    return {
      person: person,
      target: targetPerson,
      relationship: kinships[targetPerson.id] || 'no relation',
      data: data,
      kinships: kinships
    };
  };

  // ============================================================================
  // ADVANCED METHOD 4: Advanced View/Display Methods (MongoDB Enhanced Only)
  // ============================================================================
  
  /**
   * Set custom card component with MongoDB integration
   * Note: This enhances the existing setCard() method with MongoDB CRUD operations
   * @param {Object} cardComponent - Card component class
   * @returns {Object} Enhanced card instance
   */
  chart.setCardWithMongoDB = function(cardComponent) {
    // Use the original setCard method
    const card = this.setCard(cardComponent);
    
    // Enhance with MongoDB operations
    if (this.api) {
      const originalCard = card;
      
      // Override edit functionality to use MongoDB
      if (originalCard.onEdit) {
        const originalOnEdit = originalCard.onEdit.bind(originalCard);
        originalCard.onEdit = async function(personData) {
          try {
            await chart.api.updatePerson(personData.id, personData);
            chart.updateData(await chart.api.fetchFamily());
            chart.updateTree({});
          } catch (error) {
            console.error('Failed to save person edit:', error);
          }
          originalOnEdit(personData);
        };
      }
      
      // Override delete functionality to use MongoDB
      if (originalCard.onDelete) {
        const originalOnDelete = originalCard.onDelete.bind(originalCard);
        originalCard.onDelete = async function(personId) {
          try {
            await chart.api.deletePerson(personId);
            chart.updateData(await chart.api.fetchFamily());
            chart.updateTree({});
          } catch (error) {
            console.error('Failed to delete person:', error);
          }
          originalOnDelete(personId);
        };
      }
    }
    
    return card;
  };

  /**
   * REMOVED: setStyle() - This method doesn't exist in original family-chart
   * Original uses configuration passed to createChart() or Card component
   */

  /**
   * REMOVED: setCardDisplay() - This method doesn't exist in original family-chart
   * Original uses card_display property in Card component constructor
   */

  /**
   * REMOVED: fitToScreen(), zoomToPoint(), calculateTreeBounds() 
   * These don't exist in original - they were new additions
   * Original has zoom functionality but different API
   */

  // ============================================================================
  // ADVANCED METHOD 5: Form and UI Integration (MongoDB Enhanced)
  // ============================================================================
  
  /**
   * PARTIALLY EXISTS: createForm() exists in original but with different signature
   * This enhances the original createForm with MongoDB integration
   * Original: f3.handlers.createForm({datum, store, fields, ...})
   * Enhanced: chart.createFormWithMongoDB(config)
   */
  chart.createFormWithMongoDB = function(config) {
    if (!this._formBuilder) {
      this._formBuilder = new FormBuilder({
        api: this.api,
        onSubmit: async (personData, isNew) => {
          try {
            if (isNew) {
              await this.api.addPerson(personData);
            } else {
              await this.api.updatePerson(personData.id, personData);
            }
            this.updateData(await this.api.fetchFamily());
            this.updateTree({});
          } catch (error) {
            console.error('Failed to save form data:', error);
            throw error;
          }
        }
      });
    }
    
    return this._formBuilder.createForm(config);
  };

  /**
   * DOESN'T EXIST: setPersonDropdown() is not in original family-chart
   * This is a new MongoDB-enhanced feature
   * Note: Original has some person search functionality but different API
   */
  chart.setPersonDropdownMongoDB = function(config = {}, container = null) {
    const dropdownContainer = container || this.cont.querySelector('.f3-nav-cont');
    
    if (!dropdownContainer) {
      console.warn('No container found for person dropdown');
      return null;
    }
    
    this._personDropdown = new PersonDropdown(dropdownContainer, {
      data: () => this.store.getData(),
      onSelect: (personId) => {
        this.updateMainId(personId);
        if (config.onSelect) {
          config.onSelect(personId);
        }
      },
      searchFields: ['first name', 'last name', 'data.name', 'data.title'],
      ...config
    });
    
    return this._personDropdown;
  };

  /**
   * DOESN'T EXIST: enableAddRelative() and enableRemoveRelative() 
   * These are new MongoDB-enhanced features
   * Note: Original has addRelative functionality but in editTree context
   */
  chart.enableAddRelativeMongoDB = function(config = {}) {
    this._addRelativeConfig = {
      onAdd: async (relativeData, relationshipType, targetPersonId) => {
        try {
          // Create new person
          const newPerson = await this.api.addPerson(relativeData);
          
          // Update relationships
          const targetPerson = this.store.getDatum(targetPersonId);
          if (targetPerson) {
            this.updateRelationships(newPerson, targetPerson, relationshipType);
            await this.api.updatePerson(targetPersonId, targetPerson);
          }
          
          this.updateData(await this.api.fetchFamily());
          this.updateTree({});
          
          return newPerson;
        } catch (error) {
          console.error('Failed to add relative:', error);
          throw error;
        }
      },
      ...config
    };
    
    return this;
  };

  chart.enableRemoveRelativeMongoDB = function(config = {}) {
    this._removeRelativeConfig = {
      onRemove: async (personId, targetPersonId, relationshipType) => {
        try {
          // Update relationships
          const targetPerson = this.store.getDatum(targetPersonId);
          if (targetPerson) {
            this.removeRelationships(personId, targetPerson, relationshipType);
            await this.api.updatePerson(targetPersonId, targetPerson);
          }
          
          // Optionally delete the person entirely
          if (config.deletePerson) {
            await this.api.deletePerson(personId);
          }
          
          this.updateData(await this.api.fetchFamily());
          this.updateTree({});
          
        } catch (error) {
          console.error('Failed to remove relative:', error);
          throw error;
        }
      },
      ...config
    };
    
    return this;
  };

  /**
   * Update relationships between two people
   * @param {Object} person1 - First person
   * @param {Object} person2 - Second person  
   * @param {string} relationshipType - Type of relationship
   */
  chart.updateRelationships = function(person1, person2, relationshipType) {
    switch (relationshipType) {
      case 'child':
        if (!person2.rels.children) person2.rels.children = [];
        person2.rels.children.push(person1.id);
        person1.rels[person2.data.gender === 'M' ? 'father' : 'mother'] = person2.id;
        break;
      case 'parent':
        if (!person1.rels.children) person1.rels.children = [];
        person1.rels.children.push(person2.id);
        person2.rels[person1.data.gender === 'M' ? 'father' : 'mother'] = person1.id;
        break;
      case 'spouse':
        if (!person1.rels.spouses) person1.rels.spouses = [];
        if (!person2.rels.spouses) person2.rels.spouses = [];
        person1.rels.spouses.push(person2.id);
        person2.rels.spouses.push(person1.id);
        break;
      case 'sibling':
        // Find common parents and add as child to same parents
        const father = person2.rels.father;
        const mother = person2.rels.mother;
        if (father) person1.rels.father = father;
        if (mother) person1.rels.mother = mother;
        break;
    }
  };

  /**
   * Remove relationships between two people
   * @param {string} personId - Person ID to remove
   * @param {Object} targetPerson - Target person object
   * @param {string} relationshipType - Type of relationship
   */
  chart.removeRelationships = function(personId, targetPerson, relationshipType) {
    switch (relationshipType) {
      case 'child':
        if (targetPerson.rels.children) {
          targetPerson.rels.children = targetPerson.rels.children.filter(id => id !== personId);
        }
        break;
      case 'parent':
        if (targetPerson.rels.father === personId) delete targetPerson.rels.father;
        if (targetPerson.rels.mother === personId) delete targetPerson.rels.mother;
        break;
      case 'spouse':
        if (targetPerson.rels.spouses) {
          targetPerson.rels.spouses = targetPerson.rels.spouses.filter(id => id !== personId);
        }
        break;
    }
  };

  return chart;
}

/**
 * Main f3 library object with enhanced functionality
 */
const f3 = {
  CalculateTree,
  createStore,
  view,
  createSvg,
  handlers,
  elements,
  htmlHandlers,
  icons,
  createChart: createChartWithApi, // Enhanced version
  createChartBasic: createChart,   // Original version

  CardSvg,
  CardHtml,
  FamilyApi,
  TreeEditor,
  PersonDropdown,
  FormBuilder,
  KinshipCalculator,
  
  /**
   * Utility functions for common use cases
   */
  utils: {
    /**
     * Generate a unique ID for a person
     * @returns {string} UUID-like string
     */
    createPersonId: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    /**
     * Validate person data structure
     * @param {Object} person - Person object to validate
     * @param {string} person.id - Unique identifier
     * @param {Object} person.data - Person data
     * @param {Object} person.rels - Person relationships
     * @returns {boolean} Validation result
     * @throws {Error} If validation fails
     */
    validatePersonData: (person) => {
      if (!person.id) throw new Error('Person must have an id');
      if (!person.data) throw new Error('Person must have data object');
      if (!person.rels) throw new Error('Person must have rels object');
      return true;
    },
    
    /**
     * Create an empty person object
     * @param {Object} data - Initial person data
     * @returns {Object} New person object
     */
    createEmptyPerson: (data = {}) => {
      return {
        id: f3.utils.createPersonId(),
        data: { gender: 'M', ...data },
        rels: {}
      };
    },
    
    /**
     * Find a person by ID in family data
     * @param {Array} familyData - Family tree data
     * @param {string} personId - Person ID to find
     * @returns {Object|null} Found person or null
     */
    findPersonById: (familyData, personId) => {
      return familyData.find(person => person.id === personId) || null;
    },
    
    /**
     * Get all children of a person
     * @param {Array} familyData - Family tree data
     * @param {string} personId - Parent person ID
     * @returns {Array} Array of child person objects
     */
    getChildren: (familyData, personId) => {
      const person = f3.utils.findPersonById(familyData, personId);
      if (!person || !person.rels.children) return [];
      
      return person.rels.children
        .map(childId => f3.utils.findPersonById(familyData, childId))
        .filter(child => child !== null);
    },
    
    /**
     * Get parents of a person
     * @param {Array} familyData - Family tree data
     * @param {string} personId - Child person ID
     * @returns {Object} Object with father and mother (or null)
     */
    getParents: (familyData, personId) => {
      const person = f3.utils.findPersonById(familyData, personId);
      if (!person) return { father: null, mother: null };
      
      return {
        father: person.rels.father ? f3.utils.findPersonById(familyData, person.rels.father) : null,
        mother: person.rels.mother ? f3.utils.findPersonById(familyData, person.rels.mother) : null
      };
    },

    /**
     * Get all spouses of a person
     * @param {Array} familyData - Family tree data
     * @param {string} personId - Person ID
     * @returns {Array} Array of spouse person objects
     */
    getSpouses: (familyData, personId) => {
      const person = f3.utils.findPersonById(familyData, personId);
      if (!person || !person.rels.spouses) return [];
      
      return person.rels.spouses
        .map(spouseId => f3.utils.findPersonById(familyData, spouseId))
        .filter(spouse => spouse !== null);
    },

    /**
     * Get all siblings of a person
     * @param {Array} familyData - Family tree data
     * @param {string} personId - Person ID
     * @returns {Array} Array of sibling person objects
     */
    getSiblings: (familyData, personId) => {
      const person = f3.utils.findPersonById(familyData, personId);
      if (!person) return [];
      
      const siblings = [];
      const { father, mother } = f3.utils.getParents(familyData, personId);
      
      // Find children of same parents
      if (father) {
        const fatherChildren = f3.utils.getChildren(familyData, father.id);
        siblings.push(...fatherChildren.filter(child => child.id !== personId));
      }
      
      if (mother) {
        const motherChildren = f3.utils.getChildren(familyData, mother.id);
        motherChildren.forEach(child => {
          if (child.id !== personId && !siblings.find(sibling => sibling.id === child.id)) {
            siblings.push(child);
          }
        });
      }
      
      return siblings;
    },

    /**
     * Clean and validate family tree data
     * @param {Array} familyData - Family tree data
     * @returns {Array} Cleaned family data
     */
    cleanFamilyData: (familyData) => {
      return familyData.map(person => {
        // Remove temporary properties
        const cleanPerson = { ...person };
        delete cleanPerson.to_add;
        delete cleanPerson._new_rel_data;
        delete cleanPerson.unknown;
        delete cleanPerson._toggle;
        delete cleanPerson._tgdp;
        delete cleanPerson._tgdp_sp;
        delete cleanPerson.__tgdp_sp;
        
        // Ensure required structure
        if (!cleanPerson.data) cleanPerson.data = {};
        if (!cleanPerson.rels) cleanPerson.rels = {};
        
        return cleanPerson;
      });
    },

    /**
     * Export family tree data in various formats
     * @param {Array} familyData - Family tree data
     * @param {string} format - Export format ('json', 'gedcom', 'csv')
     * @returns {string} Exported data
     */
    exportFamilyData: (familyData, format = 'json') => {
      const cleanData = f3.utils.cleanFamilyData(familyData);
      
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(cleanData, null, 2);
        
        case 'csv':
          const headers = ['id', 'first_name', 'last_name', 'gender', 'birth_date', 'father_id', 'mother_id', 'spouse_ids'];
          const rows = cleanData.map(person => [
            person.id,
            person.data['first name'] || '',
            person.data['last name'] || '',
            person.data.gender || '',
            person.data.birthday || '',
            person.rels.father || '',
            person.rels.mother || '',
            (person.rels.spouses || []).join(';')
          ]);
          
          return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        case 'gedcom':
          // Basic GEDCOM export
          let gedcom = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8\n';
          
          cleanData.forEach((person, index) => {
            const id = `I${index + 1}`;
            gedcom += `0 @${id}@ INDI\n`;
            
            if (person.data['first name'] || person.data['last name']) {
              gedcom += `1 NAME ${person.data['first name'] || ''} /${person.data['last name'] || ''}/\n`;
            }
            
            if (person.data.gender) {
              gedcom += `1 SEX ${person.data.gender}\n`;
            }
            
            if (person.data.birthday) {
              gedcom += `1 BIRT\n2 DATE ${person.data.birthday}\n`;
            }
          });
          
          gedcom += '0 TRLR\n';
          return gedcom;
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    }
  }
};

export default f3;