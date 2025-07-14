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

/**
 * Enhanced createChart function with API support
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
  
  return chart;
}

/**
 * Main f3 library object
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
    }
  }
}

export default f3
