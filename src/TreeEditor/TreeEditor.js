// TreeEditor/TreeEditor.js

/**
 * Interactive tree editor with MongoDB integration
 * Handles adding, editing, and deleting family members
 */
class TreeEditor {
  constructor(container, store, config = {}) {
    this.container = container;
    this.store = store;
    this.config = {
      api: null,
      onPersonAdd: null,
      onPersonUpdate: null,
      onPersonDelete: null,
      enableDragDrop: true,
      enableInlineEdit: true,
      ...config
    };
    
    this.isActive = false;
    this.currentEditPerson = null;
    this.editMode = null; // 'add', 'edit', 'delete'
    this.relationshipBuffer = null; // For drag-drop relationship creation
    
    this.init();
  }

  /**
   * Initialize the tree editor
   */
  init() {
    this.createEditorUI();
    this.attachEventListeners();
  }

  /**
   * Create editor UI elements
   */
  createEditorUI() {
    // Create editor toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'f3-editor-toolbar';
    this.toolbar.innerHTML = `
      <div class="f3-editor-controls">
        <button class="f3-btn f3-btn-add" data-action="add-person">
          <i class="f3-icon-plus"></i> Add Person
        </button>
        <button class="f3-btn f3-btn-edit" data-action="edit-mode" title="Toggle Edit Mode">
          <i class="f3-icon-edit"></i> Edit Mode
        </button>
        <button class="f3-btn f3-btn-save" data-action="save-all" title="Save All Changes">
          <i class="f3-icon-save"></i> Save
        </button>
        <button class="f3-btn f3-btn-undo" data-action="undo" title="Undo Last Change">
          <i class="f3-icon-undo"></i> Undo
        </button>
      </div>
      <div class="f3-editor-status">
        <span class="f3-status-text">Ready</span>
      </div>
    `;

    // Create modal for editing
    this.modal = document.createElement('div');
    this.modal.className = 'f3-editor-modal';
    this.modal.innerHTML = `
      <div class="f3-modal-backdrop"></div>
      <div class="f3-modal-content">
        <div class="f3-modal-header">
          <h3 class="f3-modal-title">Edit Person</h3>
          <button class="f3-modal-close" type="button">&times;</button>
        </div>
        <div class="f3-modal-body">
          <form class="f3-person-form">
            <div class="f3-form-group">
              <label for="firstName">First Name</label>
              <input type="text" id="firstName" name="first name" class="f3-form-control">
            </div>
            <div class="f3-form-group">
              <label for="lastName">Last Name</label>
              <input type="text" id="lastName" name="last name" class="f3-form-control">
            </div>
            <div class="f3-form-group">
              <label for="gender">Gender</label>
              <select id="gender" name="gender" class="f3-form-control">
                <option value="">Select...</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div class="f3-form-group">
              <label for="birthday">Birth Date</label>
              <input type="date" id="birthday" name="birthday" class="f3-form-control">
            </div>
            <div class="f3-form-group">
              <label for="avatar">Photo URL</label>
              <input type="url" id="avatar" name="avatar" class="f3-form-control">
            </div>
            <div class="f3-form-group">
              <label for="notes">Notes</label>
              <textarea id="notes" name="notes" class="f3-form-control" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="f3-modal-footer">
          <button type="button" class="f3-btn f3-btn-secondary" data-action="cancel">Cancel</button>
          <button type="button" class="f3-btn f3-btn-danger" data-action="delete" style="display:none;">Delete</button>
          <button type="button" class="f3-btn f3-btn-primary" data-action="save">Save</button>
        </div>
      </div>
    `;

    // Add to container
    this.container.appendChild(this.toolbar);
    this.container.appendChild(this.modal);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toolbar events
    this.toolbar.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleToolbarAction(action, e);
      }
    });

    // Modal events
    this.modal.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleModalAction(action, e);
      }
      
      // Close modal when clicking backdrop
      if (e.target.classList.contains('f3-modal-backdrop') || 
          e.target.classList.contains('f3-modal-close')) {
        this.closeModal();
      }
    });

    // Form submission
    const form = this.modal.querySelector('.f3-person-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleModalAction('save', e);
    });

    // Card click events for editing
    this.container.addEventListener('click', (e) => {
      if (!this.isActive) return;
      
      const card = e.target.closest('.f3-card');
      if (card) {
        const personId = card.dataset.personId;
        if (personId) {
          this.editPerson(personId);
        }
      }
    });

    // Drag and drop for relationship creation
    if (this.config.enableDragDrop) {
      this.setupDragDrop();
    }
  }

  /**
   * Handle toolbar actions
   */
  async handleToolbarAction(action, event) {
    switch (action) {
      case 'add-person':
        await this.addPerson();
        break;
      case 'edit-mode':
        this.toggleEditMode();
        break;
      case 'save-all':
        await this.saveAll();
        break;
      case 'undo':
        this.undo();
        break;
    }
  }

  /**
   * Handle modal actions
   */
  async handleModalAction(action, event) {
    switch (action) {
      case 'save':
        await this.savePerson();
        break;
      case 'delete':
        await this.deletePerson();
        break;
      case 'cancel':
        this.closeModal();
        break;
    }
  }

  /**
   * Add a new person
   */
  async addPerson(relationshipData = null) {
    const newPerson = {
      id: this.generateId(),
      data: {
        'first name': '',
        'last name': '',
        gender: 'M'
      },
      rels: {}
    };

    // Set up relationships if provided
    if (relationshipData) {
      this.setupRelationship(newPerson, relationshipData);
    }

    this.openModal(newPerson, 'add');
  }

  /**
   * Edit an existing person
   */
  editPerson(personId) {
    const person = this.store.getDatum(personId);
    if (person) {
      this.openModal(person, 'edit');
    }
  }

  /**
   * Open the edit modal
   */
  openModal(person, mode = 'edit') {
    this.currentEditPerson = person;
    this.editMode = mode;

    // Update modal title
    const title = mode === 'add' ? 'Add New Person' : 'Edit Person';
    this.modal.querySelector('.f3-modal-title').textContent = title;

    // Show/hide delete button
    const deleteBtn = this.modal.querySelector('[data-action="delete"]');
    deleteBtn.style.display = mode === 'edit' ? 'block' : 'none';

    // Populate form
    this.populateForm(person);

    // Show modal
    this.modal.classList.add('f3-modal-active');
    document.body.classList.add('f3-modal-open');
  }

  /**
   * Close the edit modal
   */
  closeModal() {
    this.modal.classList.remove('f3-modal-active');
    document.body.classList.remove('f3-modal-open');
    this.currentEditPerson = null;
    this.editMode = null;
  }

  /**
   * Populate form with person data
   */
  populateForm(person) {
    const form = this.modal.querySelector('.f3-person-form');
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const value = person.data[input.name] || '';
      if (input.type === 'checkbox') {
        input.checked = !!value;
      } else {
        input.value = value;
      }
    });
  }

  /**
   * Get form data
   */
  getFormData() {
    const form = this.modal.querySelector('.f3-person-form');
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  }

  /**
   * Save person data
   */
  async savePerson() {
    try {
      const formData = this.getFormData();
      const person = { ...this.currentEditPerson };
      
      // Update person data
      Object.assign(person.data, formData);

      if (this.editMode === 'add') {
        // Add new person
        if (this.config.onPersonAdd) {
          await this.config.onPersonAdd(person);
        } else {
          this.store.getData().push(person);
        }
        this.updateStatus('Person added successfully');
      } else {
        // Update existing person
        if (this.config.onPersonUpdate) {
          await this.config.onPersonUpdate(person.id, person);
        }
        this.updateStatus('Person updated successfully');
      }

      this.closeModal();
      
    } catch (error) {
      console.error('Failed to save person:', error);
      this.updateStatus('Failed to save person', 'error');
    }
  }

  /**
   * Delete person
   */
  async deletePerson() {
    if (!this.currentEditPerson) return;

    const confirmed = confirm('Are you sure you want to delete this person? This action cannot be undone.');
    if (!confirmed) return;

    try {
      if (this.config.onPersonDelete) {
        await this.config.onPersonDelete(this.currentEditPerson.id);
      } else {
        // Remove from local data
        const data = this.store.getData();
        const index = data.findIndex(p => p.id === this.currentEditPerson.id);
        if (index > -1) {
          data.splice(index, 1);
        }
      }

      this.updateStatus('Person deleted successfully');
      this.closeModal();
      
    } catch (error) {
      console.error('Failed to delete person:', error);
      this.updateStatus('Failed to delete person', 'error');
    }
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode() {
    this.isActive = !this.isActive;
    const btn = this.toolbar.querySelector('[data-action="edit-mode"]');
    
    if (this.isActive) {
      btn.classList.add('f3-btn-active');
      this.container.classList.add('f3-edit-mode');
      this.updateStatus('Edit mode enabled - click cards to edit');
    } else {
      btn.classList.remove('f3-btn-active');
      this.container.classList.remove('f3-edit-mode');
      this.updateStatus('Edit mode disabled');
    }
  }

  /**
   * Save all changes
   */
  async saveAll() {
    try {
      if (this.config.api) {
        const data = this.store.getData();
        await this.config.api.saveFamily(data);
        this.updateStatus('All changes saved successfully');
      }
    } catch (error) {
      console.error('Failed to save all changes:', error);
      this.updateStatus('Failed to save changes', 'error');
    }
  }

  /**
   * Undo last change
   */
  undo() {
    // Implementation depends on having an undo stack
    this.updateStatus('Undo functionality not yet implemented');
  }

  /**
   * Setup drag and drop for relationship creation
   */
  setupDragDrop() {
    let draggedCard = null;

    this.container.addEventListener('dragstart', (e) => {
      if (!this.isActive) return;
      
      const card = e.target.closest('.f3-card');
      if (card) {
        draggedCard = card;
        e.dataTransfer.effectAllowed = 'link';
        e.dataTransfer.setData('text/plain', card.dataset.personId);
      }
    });

    this.container.addEventListener('dragover', (e) => {
      if (!this.isActive || !draggedCard) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'link';
    });

    this.container.addEventListener('drop', (e) => {
      if (!this.isActive || !draggedCard) return;
      e.preventDefault();
      
      const targetCard = e.target.closest('.f3-card');
      if (targetCard && targetCard !== draggedCard) {
        const sourceId = draggedCard.dataset.personId;
        const targetId = targetCard.dataset.personId;
        this.createRelationshipDialog(sourceId, targetId);
      }
      
      draggedCard = null;
    });
  }

  /**
   * Create relationship dialog
   */
  createRelationshipDialog(sourceId, targetId) {
    const sourcePerson = this.store.getDatum(sourceId);
    const targetPerson = this.store.getDatum(targetId);
    
    if (!sourcePerson || !targetPerson) return;

    const relationships = [
      { value: 'spouse', label: 'Spouse' },
      { value: 'child', label: 'Child of target' },
      { value: 'parent', label: 'Parent of target' },
      { value: 'sibling', label: 'Sibling of target' }
    ];

    const relationshipHtml = relationships
      .map(rel => `<option value="${rel.value}">${rel.label}</option>`)
      .join('');

    const dialog = document.createElement('div');
    dialog.className = 'f3-relationship-dialog';
    dialog.innerHTML = `
      <div class="f3-dialog-content">
        <h4>Create Relationship</h4>
        <p>Set relationship between:</p>
        <p><strong>${sourcePerson.data['first name']} ${sourcePerson.data['last name']}</strong></p>
        <p>and</p>
        <p><strong>${targetPerson.data['first name']} ${targetPerson.data['last name']}</strong></p>
        <select class="f3-relationship-select">
          <option value="">Select relationship...</option>
          ${relationshipHtml}
        </select>
        <div class="f3-dialog-actions">
          <button class="f3-btn f3-btn-secondary" data-action="cancel">Cancel</button>
          <button class="f3-btn f3-btn-primary" data-action="create">Create</button>
        </div>
      </div>
    `;

    dialog.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      if (action === 'create') {
        const relationship = dialog.querySelector('.f3-relationship-select').value;
        if (relationship) {
          await this.createRelationship(sourceId, targetId, relationship);
        }
      }
      dialog.remove();
    });

    this.container.appendChild(dialog);
  }

  /**
   * Create relationship between two people
   */
  async createRelationship(sourceId, targetId, relationshipType) {
    try {
      const sourcePerson = this.store.getDatum(sourceId);
      const targetPerson = this.store.getDatum(targetId);

      // Update relationships based on type
      switch (relationshipType) {
        case 'spouse':
          if (!sourcePerson.rels.spouses) sourcePerson.rels.spouses = [];
          if (!targetPerson.rels.spouses) targetPerson.rels.spouses = [];
          sourcePerson.rels.spouses.push(targetId);
          targetPerson.rels.spouses.push(sourceId);
          break;
        
        case 'child':
          if (!targetPerson.rels.children) targetPerson.rels.children = [];
          targetPerson.rels.children.push(sourceId);
          sourcePerson.rels[targetPerson.data.gender === 'M' ? 'father' : 'mother'] = targetId;
          break;
        
        case 'parent':
          if (!sourcePerson.rels.children) sourcePerson.rels.children = [];
          sourcePerson.rels.children.push(targetId);
          targetPerson.rels[sourcePerson.data.gender === 'M' ? 'father' : 'mother'] = sourceId;
          break;
        
        case 'sibling':
          // Set same parents if possible
          const sourceParents = this.getParents(sourcePerson);
          if (sourceParents.father) targetPerson.rels.father = sourceParents.father;
          if (sourceParents.mother) targetPerson.rels.mother = sourceParents.mother;
          break;
      }

      // Save changes
      if (this.config.onPersonUpdate) {
        await this.config.onPersonUpdate(sourceId, sourcePerson);
        await this.config.onPersonUpdate(targetId, targetPerson);
      }

      this.updateStatus('Relationship created successfully');
      
    } catch (error) {
      console.error('Failed to create relationship:', error);
      this.updateStatus('Failed to create relationship', 'error');
    }
  }

  /**
   * Get parents of a person
   */
  getParents(person) {
    const data = this.store.getData();
    return {
      father: person.rels.father ? data.find(p => p.id === person.rels.father) : null,
      mother: person.rels.mother ? data.find(p => p.id === person.rels.mother) : null
    };
  }

  /**
   * Setup relationship for new person
   */
  setupRelationship(newPerson, relationshipData) {
    const { targetPersonId, relationshipType } = relationshipData;
    const targetPerson = this.store.getDatum(targetPersonId);
    
    if (!targetPerson) return;

    // Set up initial relationship structure
    switch (relationshipType) {
      case 'child':
        newPerson.rels[targetPerson.data.gender === 'M' ? 'father' : 'mother'] = targetPersonId;
        break;
      case 'parent':
        if (!newPerson.rels.children) newPerson.rels.children = [];
        newPerson.rels.children.push(targetPersonId);
        break;
      case 'spouse':
        if (!newPerson.rels.spouses) newPerson.rels.spouses = [];
        newPerson.rels.spouses.push(targetPersonId);
        break;
    }
  }

  /**
   * Update status message
   */
  updateStatus(message, type = 'info') {
    const statusElement = this.toolbar.querySelector('.f3-status-text');
    statusElement.textContent = message;
    statusElement.className = `f3-status-text f3-status-${type}`;
    
    // Clear status after 3 seconds
    setTimeout(() => {
      statusElement.textContent = 'Ready';
      statusElement.className = 'f3-status-text';
    }, 3000);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Destroy the editor
   */
  destroy() {
    if (this.toolbar) this.toolbar.remove();
    if (this.modal) this.modal.remove();
    this.container.classList.remove('f3-edit-mode');
  }
}

export default TreeEditor;