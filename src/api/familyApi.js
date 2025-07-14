/**
 * API integration for MongoDB backend
 * @class FamilyApi
 */
export class FamilyApi {
  /**
   * Create a new FamilyApi instance
   * @param {Object} config - Configuration object
   * @param {string} config.baseUrl - Base URL for API calls
   * @param {string} config.familyId - Family identifier
   * @param {Object} config.headers - Additional headers
   */
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || '/api';
    this.familyId = config.familyId;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }

  /**
   * Set the family ID for API calls
   * @param {string} familyId - Family identifier
   */
  setFamilyId(familyId) {
    this.familyId = familyId;
  }

  /**
   * Fetch family tree data from API
   * @param {string} familyId - Optional family ID override
   * @returns {Promise<Array>} Family tree data array
   */
  async fetchFamily(familyId = this.familyId) {
    if (!familyId) throw new Error('Family ID is required');
    
    try {
      const response = await fetch(`${this.baseUrl}/family/${familyId}`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch family data: ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.transformFromApi(data);
    } catch (error) {
      console.error('Error fetching family data:', error);
      throw error;
    }
  }

  /**
   * Save family tree data to API
   * @param {Array} familyData - Family tree data array
   * @param {string} familyId - Optional family ID override
   * @returns {Promise<Object>} Save response
   */
  async saveFamily(familyData, familyId = this.familyId) {
    if (!familyId) throw new Error('Family ID is required');
    
    try {
      const transformedData = this.transformToApi(familyData);
      
      const response = await fetch(`${this.baseUrl}/family/${familyId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(transformedData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save family data: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving family data:', error);
      throw error;
    }
  }

  /**
   * Add a new person to the family tree
   * @param {Object} personData - Person data object
   * @param {string} familyId - Optional family ID override
   * @returns {Promise<Object>} Created person
   */
  async addPerson(personData, familyId = this.familyId) {
    if (!familyId) throw new Error('Family ID is required');
    
    try {
      const response = await fetch(`${this.baseUrl}/family/${familyId}/person`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(personData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add person: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding person:', error);
      throw error;
    }
  }

  /**
   * Update an existing person
   * @param {string} personId - Person identifier
   * @param {Object} personData - Updated person data
   * @param {string} familyId - Optional family ID override
   * @returns {Promise<Object>} Updated person
   */
  async updatePerson(personId, personData, familyId = this.familyId) {
    if (!familyId) throw new Error('Family ID is required');
    
    try {
      const response = await fetch(`${this.baseUrl}/family/${familyId}/person/${personId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(personData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update person: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating person:', error);
      throw error;
    }
  }

  /**
   * Delete a person from the family tree
   * @param {string} personId - Person identifier
   * @param {string} familyId - Optional family ID override
   * @returns {Promise<Object>} Delete response
   */
  async deletePerson(personId, familyId = this.familyId) {
    if (!familyId) throw new Error('Family ID is required');
    
    try {
      const response = await fetch(`${this.baseUrl}/family/${familyId}/person/${personId}`, {
        method: 'DELETE',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete person: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting person:', error);
      throw error;
    }
  }

  /**
   * Transform MongoDB data to family-chart format
   * @param {Object|Array} apiData - Data from API
   * @returns {Array} Transformed family data
   */
  transformFromApi(apiData) {
    if (Array.isArray(apiData)) {
      return apiData;
    }
    
    // If MongoDB returns a family document with members array
    if (apiData.members) {
      return apiData.members;
    }
    
    // If MongoDB returns the data directly
    return apiData.data || apiData;
  }

  /**
   * Transform family-chart data to MongoDB format
   * @param {Array} familyData - Family chart data
   * @returns {Array} Cleaned data for API
   */
  transformToApi(familyData) {
    // Clean up any internal family-chart properties
    return familyData.map(person => ({
      id: person.id,
      data: { ...person.data },
      rels: { ...person.rels }
    })).filter(person => !person.data._new_rel_data && !person.to_add);
  }

  /**
   * Perform batch operations for better performance
   * @param {Array} operations - Array of operations to perform
   * @param {string} familyId - Optional family ID override
   * @returns {Promise<Object>} Batch operation response
   */
  async batchUpdate(operations, familyId = this.familyId) {
    if (!familyId) throw new Error('Family ID is required');
    
    try {
      const response = await fetch(`${this.baseUrl}/family/${familyId}/batch`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ operations })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to perform batch update: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error performing batch update:', error);
      throw error;
    }
  }
}

export default FamilyApi;
