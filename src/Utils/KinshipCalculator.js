// Utils/KinshipCalculator.js

/**
 * Calculate kinship relationships between family members
 * Determines how people are related (cousin, uncle, etc.)
 */
class KinshipCalculator {
  constructor() {
    this.relationshipCache = new Map();
  }

  /**
   * Calculate kinship relationships for a person
   * @param {string} personId - Target person ID
   * @param {Array} familyData - Complete family data
   * @param {Object} options - Calculation options
   * @returns {Object} Kinship relationships
   */
  calculate(personId, familyData, options = {}) {
    const {
      maxDepth = 10,
      includeInLaws = true,
      includeStepRelations = true,
      cacheResults = true
    } = options;

    // Check cache first
    const cacheKey = `${personId}-${familyData.length}-${JSON.stringify(options)}`;
    if (cacheResults && this.relationshipCache.has(cacheKey)) {
      return this.relationshipCache.get(cacheKey);
    }

    const person = familyData.find(p => p.id === personId);
    if (!person) return {};

    const relationships = {};
    const visited = new Set();
    
    // Calculate direct relationships
    this.calculateDirectRelationships(person, familyData, relationships, visited, 0, maxDepth);
    
    // Calculate in-law relationships if enabled
    if (includeInLaws) {
      this.calculateInLawRelationships(person, familyData, relationships);
    }
    
    // Calculate step relationships if enabled
    if (includeStepRelations) {
      this.calculateStepRelationships(person, familyData, relationships);
    }

    // Cache results
    if (cacheResults) {
      this.relationshipCache.set(cacheKey, relationships);
    }

    return relationships;
  }

  /**
   * Calculate direct blood relationships
   */
  calculateDirectRelationships(person, familyData, relationships, visited, depth, maxDepth) {
    if (depth > maxDepth || visited.has(person.id)) return;
    visited.add(person.id);

    // Parents
    if (person.rels.father) {
      const father = familyData.find(p => p.id === person.rels.father);
      if (father && !relationships[father.id]) {
        relationships[father.id] = this.getParentRelationship('father', depth);
        this.calculateDirectRelationships(father, familyData, relationships, visited, depth + 1, maxDepth);
      }
    }

    if (person.rels.mother) {
      const mother = familyData.find(p => p.id === person.rels.mother);
      if (mother && !relationships[mother.id]) {
        relationships[mother.id] = this.getParentRelationship('mother', depth);
        this.calculateDirectRelationships(mother, familyData, relationships, visited, depth + 1, maxDepth);
      }
    }

    // Children
    if (person.rels.children) {
      person.rels.children.forEach(childId => {
        const child = familyData.find(p => p.id === childId);
        if (child && !relationships[child.id]) {
          relationships[child.id] = this.getChildRelationship(child.data.gender, depth);
          this.calculateDirectRelationships(child, familyData, relationships, visited, depth + 1, maxDepth);
        }
      });
    }

    // Siblings (same parents)
    this.calculateSiblingRelationships(person, familyData, relationships, depth);

    // Spouses
    if (person.rels.spouses) {
      person.rels.spouses.forEach(spouseId => {
        const spouse = familyData.find(p => p.id === spouseId);
        if (spouse && !relationships[spouse.id]) {
          relationships[spouse.id] = 'spouse';
        }
      });
    }
  }

  /**
   * Calculate sibling relationships
   */
  calculateSiblingRelationships(person, familyData, relationships, depth) {
    const siblings = this.findSiblings(person, familyData);
    
    siblings.forEach(sibling => {
      if (!relationships[sibling.id]) {
        relationships[sibling.id] = this.getSiblingRelationship(sibling.data.gender, depth);
      }
    });
  }

  /**
   * Find all siblings of a person
   */
  findSiblings(person, familyData) {
    const siblings = [];
    const { father, mother } = person.rels;

    if (father || mother) {
      familyData.forEach(other => {
        if (other.id === person.id) return;
        
        const sharesFather = father && other.rels.father === father;
        const sharesMother = mother && other.rels.mother === mother;
        
        if (sharesFather || sharesMother) {
          siblings.push(other);
        }
      });
    }

    return siblings;
  }

  /**
   * Calculate in-law relationships
   */
  calculateInLawRelationships(person, familyData, relationships) {
    // Spouse's family becomes in-laws
    if (person.rels.spouses) {
      person.rels.spouses.forEach(spouseId => {
        const spouse = familyData.find(p => p.id === spouseId);
        if (!spouse) return;

        // Spouse's parents become in-laws
        if (spouse.rels.father) {
          const fatherInLaw = familyData.find(p => p.id === spouse.rels.father);
          if (fatherInLaw && !relationships[fatherInLaw.id]) {
            relationships[fatherInLaw.id] = 'father-in-law';
          }
        }

        if (spouse.rels.mother) {
          const motherInLaw = familyData.find(p => p.id === spouse.rels.mother);
          if (motherInLaw && !relationships[motherInLaw.id]) {
            relationships[motherInLaw.id] = 'mother-in-law';
          }
        }

        // Spouse's siblings become siblings-in-law
        const spouseSiblings = this.findSiblings(spouse, familyData);
        spouseSiblings.forEach(sibling => {
          if (!relationships[sibling.id]) {
            relationships[sibling.id] = sibling.data.gender === 'M' ? 'brother-in-law' : 'sister-in-law';
          }
        });
      });
    }

    // Children's spouses become in-laws
    if (person.rels.children) {
      person.rels.children.forEach(childId => {
        const child = familyData.find(p => p.id === childId);
        if (!child || !child.rels.spouses) return;

        child.rels.spouses.forEach(childSpouseId => {
          const childSpouse = familyData.find(p => p.id === childSpouseId);
          if (childSpouse && !relationships[childSpouse.id]) {
            relationships[childSpouse.id] = child.data.gender === 'M' ? 'daughter-in-law' : 'son-in-law';
          }
        });
      });
    }
  }

  /**
   * Calculate step relationships
   */
  calculateStepRelationships(person, familyData, relationships) {
    // Step-parents (spouse of biological parent)
    ['father', 'mother'].forEach(parentType => {
      if (person.rels[parentType]) {
        const parent = familyData.find(p => p.id === person.rels[parentType]);
        if (parent && parent.rels.spouses) {
          parent.rels.spouses.forEach(stepParentId => {
            const stepParent = familyData.find(p => p.id === stepParentId);
            if (stepParent && !relationships[stepParent.id]) {
              relationships[stepParent.id] = `step-${parentType}`;
            }
          });
        }
      }
    });

    // Step-siblings (children of step-parents)
    ['father', 'mother'].forEach(parentType => {
      if (person.rels[parentType]) {
        const parent = familyData.find(p => p.id === person.rels[parentType]);
        if (parent && parent.rels.spouses) {
          parent.rels.spouses.forEach(stepParentId => {
            const stepParent = familyData.find(p => p.id === stepParentId);
            if (stepParent && stepParent.rels.children) {
              stepParent.rels.children.forEach(stepSiblingId => {
                if (stepSiblingId !== person.id && !relationships[stepSiblingId]) {
                  const stepSibling = familyData.find(p => p.id === stepSiblingId);
                  if (stepSibling) {
                    relationships[stepSiblingId] = stepSibling.data.gender === 'M' ? 'step-brother' : 'step-sister';
                  }
                }
              });
            }
          });
        }
      }
    });
  }

  /**
   * Get parent relationship description
   */
  getParentRelationship(parentType, generationDepth) {
    if (generationDepth === 0) {
      return parentType;
    } else if (generationDepth === 1) {
      return `grand${parentType}`;
    } else {
      const greats = 'great-'.repeat(generationDepth - 1);
      return `${greats}grand${parentType}`;
    }
  }

  /**
   * Get child relationship description
   */
  getChildRelationship(gender, generationDepth) {
    const baseRelation = gender === 'M' ? 'son' : 'daughter';
    
    if (generationDepth === 0) {
      return baseRelation;
    } else if (generationDepth === 1) {
      return `grand${baseRelation}`;
    } else {
      const greats = 'great-'.repeat(generationDepth - 1);
      return `${greats}grand${baseRelation}`;
    }
  }

  /**
   * Get sibling relationship description
   */
  getSiblingRelationship(gender, generationDepth) {
    if (generationDepth === 0) {
      return gender === 'M' ? 'brother' : 'sister';
    }
    
    // For cousins and more distant relationships
    return this.getCousinRelationship(generationDepth);
  }

  /**
   * Get cousin relationship description
   */
  getCousinRelationship(generationDifference) {
    if (generationDifference === 1) {
      return 'cousin';
    } else if (generationDifference === 2) {
      return '2nd cousin';
    } else if (generationDifference === 3) {
      return '3rd cousin';
    } else {
      return `${generationDifference}th cousin`;
    }
  }

  /**
   * Calculate relationship between two specific people
   * @param {string} person1Id - First person ID
   * @param {string} person2Id - Second person ID
   * @param {Array} familyData - Complete family data
   * @returns {string} Relationship description
   */
  getRelationshipBetween(person1Id, person2Id, familyData) {
    if (person1Id === person2Id) return 'self';

    const relationships = this.calculate(person1Id, familyData);
    return relationships[person2Id] || 'no relation';
  }

  /**
   * Find common ancestors between two people
   * @param {string} person1Id - First person ID
   * @param {string} person2Id - Second person ID
   * @param {Array} familyData - Complete family data
   * @returns {Array} Common ancestors
   */
  findCommonAncestors(person1Id, person2Id, familyData) {
    const ancestors1 = this.getAncestors(person1Id, familyData);
    const ancestors2 = this.getAncestors(person2Id, familyData);
    
    return ancestors1.filter(ancestor => 
      ancestors2.some(a => a.id === ancestor.id)
    );
  }

  /**
   * Get all ancestors of a person
   * @param {string} personId - Person ID
   * @param {Array} familyData - Complete family data
   * @param {number} maxDepth - Maximum depth to search
   * @returns {Array} Ancestor objects with generation info
   */
  getAncestors(personId, familyData, maxDepth = 10) {
    const ancestors = [];
    const visited = new Set();

    const findAncestors = (currentPersonId, generation) => {
      if (generation > maxDepth || visited.has(currentPersonId)) return;
      visited.add(currentPersonId);

      const person = familyData.find(p => p.id === currentPersonId);
      if (!person) return;

      // Add parents
      ['father', 'mother'].forEach(parentType => {
        if (person.rels[parentType]) {
          const parent = familyData.find(p => p.id === person.rels[parentType]);
          if (parent) {
            ancestors.push({
              ...parent,
              generation,
              relationship: this.getParentRelationship(parentType, generation - 1)
            });
            findAncestors(parent.id, generation + 1);
          }
        }
      });
    };

    findAncestors(personId, 1);
    return ancestors;
  }

  /**
   * Get all descendants of a person
   * @param {string} personId - Person ID
   * @param {Array} familyData - Complete family data
   * @param {number} maxDepth - Maximum depth to search
   * @returns {Array} Descendant objects with generation info
   */
  getDescendants(personId, familyData, maxDepth = 10) {
    const descendants = [];
    const visited = new Set();

    const findDescendants = (currentPersonId, generation) => {
      if (generation > maxDepth || visited.has(currentPersonId)) return;
      visited.add(currentPersonId);

      const person = familyData.find(p => p.id === currentPersonId);
      if (!person || !person.rels.children) return;

      person.rels.children.forEach(childId => {
        const child = familyData.find(p => p.id === childId);
        if (child) {
          descendants.push({
            ...child,
            generation,
            relationship: this.getChildRelationship(child.data.gender, generation - 1)
          });
          findDescendants(child.id, generation + 1);
        }
      });
    };

    findDescendants(personId, 1);
    return descendants;
  }

  /**
   * Calculate family statistics
   * @param {Array} familyData - Complete family data
   * @returns {Object} Family statistics
   */
  calculateFamilyStats(familyData) {
    const stats = {
      totalPeople: familyData.length,
      males: 0,
      females: 0,
      marriages: 0,
      generations: 0,
      oldestPerson: null,
      youngestPerson: null,
      averageAge: 0,
      familyNames: new Set()
    };

    let totalAge = 0;
    let ageCount = 0;

    familyData.forEach(person => {
      // Gender count
      if (person.data.gender === 'M') stats.males++;
      else if (person.data.gender === 'F') stats.females++;

      // Age calculations
      if (person.data.birthday) {
        const birthDate = new Date(person.data.birthday);
        const age = this.calculateAge(birthDate);
        
        if (age >= 0) {
          totalAge += age;
          ageCount++;

          if (!stats.oldestPerson || age > this.calculateAge(new Date(stats.oldestPerson.data.birthday))) {
            stats.oldestPerson = person;
          }

          if (!stats.youngestPerson || age < this.calculateAge(new Date(stats.youngestPerson.data.birthday))) {
            stats.youngestPerson = person;
          }
        }
      }

      // Family names
      if (person.data['last name']) {
        stats.familyNames.add(person.data['last name']);
      }

      // Marriage count (count each marriage once)
      if (person.rels.spouses) {
        stats.marriages += person.rels.spouses.length;
      }
    });

    // Calculate averages
    stats.averageAge = ageCount > 0 ? Math.round(totalAge / ageCount) : 0;
    stats.marriages = Math.floor(stats.marriages / 2); // Each marriage counted twice
    stats.familyNames = Array.from(stats.familyNames);

    // Calculate generation depth
    if (familyData.length > 0) {
      const rootPerson = familyData[0];
      const ancestors = this.getAncestors(rootPerson.id, familyData);
      const descendants = this.getDescendants(rootPerson.id, familyData);
      
      const maxAncestorGen = ancestors.length > 0 ? Math.max(...ancestors.map(a => a.generation)) : 0;
      const maxDescendantGen = descendants.length > 0 ? Math.max(...descendants.map(d => d.generation)) : 0;
      
      stats.generations = maxAncestorGen + maxDescendantGen + 1;
    }

    return stats;
  }

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Clear relationship cache
   */
  clearCache() {
    this.relationshipCache.clear();
  }

  /**
   * Get relationship suggestions for connecting two people
   * @param {string} person1Id - First person ID
   * @param {string} person2Id - Second person ID
   * @param {Array} familyData - Complete family data
   * @returns {Array} Suggested relationships
   */
  getRelationshipSuggestions(person1Id, person2Id, familyData) {
    const person1 = familyData.find(p => p.id === person1Id);
    const person2 = familyData.find(p => p.id === person2Id);
    
    if (!person1 || !person2) return [];

    const suggestions = [];
    
    // Age-based suggestions
    const age1 = person1.data.birthday ? this.calculateAge(new Date(person1.data.birthday)) : null;
    const age2 = person2.data.birthday ? this.calculateAge(new Date(person2.data.birthday)) : null;
    
    if (age1 !== null && age2 !== null) {
      const ageDiff = Math.abs(age1 - age2);
      
      if (ageDiff < 5) {
        suggestions.push({ type: 'sibling', confidence: 0.8 });
        suggestions.push({ type: 'spouse', confidence: 0.6 });
      } else if (ageDiff >= 20 && ageDiff <= 40) {
        if (age1 > age2) {
          suggestions.push({ type: 'parent', confidence: 0.7, note: `${person1.data['first name']} could be parent of ${person2.data['first name']}` });
        } else {
          suggestions.push({ type: 'child', confidence: 0.7, note: `${person1.data['first name']} could be child of ${person2.data['first name']}` });
        }
      } else if (ageDiff >= 40) {
        if (age1 > age2) {
          suggestions.push({ type: 'grandparent', confidence: 0.6, note: `${person1.data['first name']} could be grandparent of ${person2.data['first name']}` });
        } else {
          suggestions.push({ type: 'grandchild', confidence: 0.6, note: `${person1.data['first name']} could be grandchild of ${person2.data['first name']}` });
        }
      }
    }

    // Name-based suggestions
    if (person1.data['last name'] && person2.data['last name']) {
      if (person1.data['last name'] === person2.data['last name']) {
        suggestions.push({ type: 'sibling', confidence: 0.5, note: 'Same last name' });
        suggestions.push({ type: 'cousin', confidence: 0.4, note: 'Same family name' });
      }
    }

    // Gender-based suggestions for spouses
    if (person1.data.gender && person2.data.gender && person1.data.gender !== person2.data.gender) {
      suggestions.push({ type: 'spouse', confidence: 0.3 });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate family tree consistency
   * @param {Array} familyData - Complete family data
   * @returns {Object} Validation results
   */
  validateFamilyTree(familyData) {
    const errors = [];
    const warnings = [];

    familyData.forEach(person => {
      // Check for circular relationships
      if (this.hasCircularRelationship(person.id, familyData)) {
        errors.push({
          type: 'circular_relationship',
          personId: person.id,
          message: `${person.data['first name']} ${person.data['last name']} has circular family relationships`
        });
      }

      // Check for impossible age relationships
      if (person.rels.children) {
        person.rels.children.forEach(childId => {
          const child = familyData.find(p => p.id === childId);
          if (child && person.data.birthday && child.data.birthday) {
            const parentAge = this.calculateAge(new Date(person.data.birthday));
            const childAge = this.calculateAge(new Date(child.data.birthday));
            
            if (parentAge - childAge < 12) {
              warnings.push({
                type: 'impossible_age',
                personId: person.id,
                relatedPersonId: childId,
                message: `${person.data['first name']} was too young to be parent of ${child.data['first name']}`
              });
            }
          }
        });
      }

      // Check for missing spouse relationships
      if (person.rels.children) {
        person.rels.children.forEach(childId => {
          const child = familyData.find(p => p.id === childId);
          if (child) {
            const otherParentId = child.rels.father === person.id ? child.rels.mother : child.rels.father;
            if (otherParentId) {
              const hasSpouseRelation = person.rels.spouses && person.rels.spouses.includes(otherParentId);
              if (!hasSpouseRelation) {
                warnings.push({
                  type: 'missing_spouse_relation',
                  personId: person.id,
                  relatedPersonId: otherParentId,
                  message: `${person.data['first name']} should be marked as spouse of other parent`
                });
              }
            }
          }
        });
      }

      // Check for orphaned relationships
      ['father', 'mother'].forEach(parentType => {
        if (person.rels[parentType]) {
          const parent = familyData.find(p => p.id === person.rels[parentType]);
          if (!parent) {
            errors.push({
              type: 'orphaned_relationship',
              personId: person.id,
              message: `${person.data['first name']} references missing ${parentType}`
            });
          } else if (!parent.rels.children || !parent.rels.children.includes(person.id)) {
            warnings.push({
              type: 'asymmetric_relationship',
              personId: person.id,
              relatedPersonId: parent.id,
              message: `${parentType} relationship is not reciprocal`
            });
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        peopleAffected: new Set([...errors, ...warnings].map(issue => issue.personId)).size
      }
    };
  }

  /**
   * Check for circular relationships
   */
  hasCircularRelationship(personId, familyData, visited = new Set()) {
    if (visited.has(personId)) return true;
    visited.add(personId);

    const person = familyData.find(p => p.id === personId);
    if (!person) return false;

    // Check ancestors
    const ancestors = [person.rels.father, person.rels.mother].filter(Boolean);
    for (const ancestorId of ancestors) {
      if (this.hasCircularRelationship(ancestorId, familyData, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Fix common relationship inconsistencies
   * @param {Array} familyData - Complete family data
   * @returns {Array} Fixed family data
   */
  fixRelationshipInconsistencies(familyData) {
    const fixedData = JSON.parse(JSON.stringify(familyData)); // Deep clone

    fixedData.forEach(person => {
      // Fix missing reciprocal parent-child relationships
      ['father', 'mother'].forEach(parentType => {
        if (person.rels[parentType]) {
          const parent = fixedData.find(p => p.id === person.rels[parentType]);
          if (parent) {
            if (!parent.rels.children) parent.rels.children = [];
            if (!parent.rels.children.includes(person.id)) {
              parent.rels.children.push(person.id);
            }
          }
        }
      });

      // Fix missing reciprocal spouse relationships
      if (person.rels.spouses) {
        person.rels.spouses.forEach(spouseId => {
          const spouse = fixedData.find(p => p.id === spouseId);
          if (spouse) {
            if (!spouse.rels.spouses) spouse.rels.spouses = [];
            if (!spouse.rels.spouses.includes(person.id)) {
              spouse.rels.spouses.push(person.id);
            }
          }
        });
      }

      // Fix missing spouse relationships between co-parents
      if (person.rels.children) {
        person.rels.children.forEach(childId => {
          const child = fixedData.find(p => p.id === childId);
          if (child) {
            const otherParentId = child.rels.father === person.id ? child.rels.mother : child.rels.father;
            if (otherParentId && otherParentId !== person.id) {
              // Add spouse relationship if not exists
              if (!person.rels.spouses) person.rels.spouses = [];
              if (!person.rels.spouses.includes(otherParentId)) {
                person.rels.spouses.push(otherParentId);
              }
            }
          }
        });
      }
    });

    return fixedData;
  }

  /**
   * Generate relationship path between two people
   * @param {string} person1Id - Starting person ID
   * @param {string} person2Id - Target person ID
   * @param {Array} familyData - Complete family data
   * @returns {Array} Path of relationships
   */
  getRelationshipPath(person1Id, person2Id, familyData) {
    if (person1Id === person2Id) return [{ personId: person1Id, relationship: 'self' }];

    const visited = new Set();
    const queue = [{ personId: person1Id, path: [{ personId: person1Id, relationship: 'start' }] }];

    while (queue.length > 0) {
      const { personId, path } = queue.shift();
      
      if (visited.has(personId)) continue;
      visited.add(personId);

      const person = familyData.find(p => p.id === personId);
      if (!person) continue;

      // Get all connected people
      const connections = this.getDirectConnections(person, familyData);

      for (const connection of connections) {
        if (connection.personId === person2Id) {
          return [...path, { personId: connection.personId, relationship: connection.relationship }];
        }

        if (!visited.has(connection.personId) && path.length < 10) { // Limit depth
          queue.push({
            personId: connection.personId,
            path: [...path, { personId: connection.personId, relationship: connection.relationship }]
          });
        }
      }
    }

    return []; // No path found
  }

  /**
   * Get direct connections for a person
   */
  getDirectConnections(person, familyData) {
    const connections = [];

    // Parents
    ['father', 'mother'].forEach(parentType => {
      if (person.rels[parentType]) {
        connections.push({
          personId: person.rels[parentType],
          relationship: parentType
        });
      }
    });

    // Children
    if (person.rels.children) {
      person.rels.children.forEach(childId => {
        const child = familyData.find(p => p.id === childId);
        if (child) {
          connections.push({
            personId: childId,
            relationship: child.data.gender === 'M' ? 'son' : 'daughter'
          });
        }
      });
    }

    // Spouses
    if (person.rels.spouses) {
      person.rels.spouses.forEach(spouseId => {
        connections.push({
          personId: spouseId,
          relationship: 'spouse'
        });
      });
    }

    // Siblings
    const siblings = this.findSiblings(person, familyData);
    siblings.forEach(sibling => {
      connections.push({
        personId: sibling.id,
        relationship: sibling.data.gender === 'M' ? 'brother' : 'sister'
      });
    });

    return connections;
  }

  /**
   * Export kinship data for external analysis
   * @param {string} personId - Target person ID
   * @param {Array} familyData - Complete family data
   * @returns {Object} Exportable kinship data
   */
  exportKinshipData(personId, familyData) {
    const relationships = this.calculate(personId, familyData);
    const person = familyData.find(p => p.id === personId);
    
    return {
      targetPerson: {
        id: person.id,
        name: `${person.data['first name'] || ''} ${person.data['last name'] || ''}`.trim(),
        data: person.data
      },
      relationships: Object.entries(relationships).map(([relatedPersonId, relationship]) => {
        const relatedPerson = familyData.find(p => p.id === relatedPersonId);
        return {
          personId: relatedPersonId,
          name: relatedPerson ? `${relatedPerson.data['first name'] || ''} ${relatedPerson.data['last name'] || ''}`.trim() : 'Unknown',
          relationship,
          data: relatedPerson ? relatedPerson.data : null
        };
      }),
      statistics: this.calculateFamilyStats(familyData),
      generatedAt: new Date().toISOString()
    };
  }
}

export default KinshipCalculator;