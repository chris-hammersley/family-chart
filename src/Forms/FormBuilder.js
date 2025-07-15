// Forms/FormBuilder.js

/**
 * Dynamic form builder for person data with MongoDB integration
 * Creates and manages forms for adding/editing family members
 */
class FormBuilder {
  constructor(config = {}) {
    this.config = {
      api: null,
      onSubmit: null,
      onCancel: null,
      validateOnChange: true,
      autoSave: false,
      ...config
    };

    this.currentForm = null;
    this.formData = {};
    this.validators = {};
    this.isSubmitting = false;
  }

  /**
   * Create a form with the given configuration
   */
  createForm(formConfig) {
    const {
      container,
      person = null,
      fields = this.getDefaultFields(),
      title = person ? 'Edit Person' : 'Add Person',
      submitText = 'Save',
      cancelText = 'Cancel',
      showDelete = !!person,
      layout = 'vertical'
    } = formConfig;

    this.currentPerson = person;
    this.formData = person ? { ...person.data } : {};

    const form = this.buildForm({
      fields,
      title,
      submitText,
      cancelText,
      showDelete,
      layout
    });

    if (container) {
      container.innerHTML = '';
      container.appendChild(form);
    }

    this.currentForm = form;
    return form;
  }

  /**
   * Build the HTML form structure
   */
  buildForm(config) {
    const form = document.createElement('div');
    form.className = `f3-form-builder f3-form-${config.layout}`;
    
    form.innerHTML = `
      <div class="f3-form-header">
        <h3 class="f3-form-title">${config.title}</h3>
      </div>
      
      <form class="f3-form" novalidate>
        <div class="f3-form-fields">
          ${config.fields.map(field => this.buildField(field)).join('')}
        </div>
        
        <div class="f3-form-footer">
          <div class="f3-form-actions">
            <button type="button" class="f3-btn f3-btn-secondary" data-action="cancel">
              ${config.cancelText}
            </button>
            ${config.showDelete ? `
              <button type="button" class="f3-btn f3-btn-danger" data-action="delete">
                Delete
              </button>
            ` : ''}
            <button type="submit" class="f3-btn f3-btn-primary" data-action="submit">
              ${config.submitText}
            </button>
          </div>
          <div class="f3-form-status" style="display: none;"></div>
        </div>
      </form>
    `;

    this.attachFormEvents(form);
    this.populateForm(form);
    
    return form;
  }

  /**
   * Build individual form field
   */
  buildField(fieldConfig) {
    const {
      name,
      label,
      type = 'text',
      required = false,
      placeholder = '',
      options = [],
      validation = {},
      helpText = '',
      colspan = 1
    } = fieldConfig;

    const fieldId = `field_${name.replace(/\s+/g, '_')}`;
    const requiredAttr = required ? 'required' : '';
    const requiredMark = required ? '<span class="f3-required">*</span>' : '';

    let inputHtml = '';
    
    switch (type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        inputHtml = `
          <input 
            type="${type}" 
            id="${fieldId}" 
            name="${name}" 
            class="f3-form-control" 
            placeholder="${placeholder}"
            ${requiredAttr}
          >
        `;
        break;
        
      case 'date':
        inputHtml = `
          <input 
            type="date" 
            id="${fieldId}" 
            name="${name}" 
            class="f3-form-control"
            ${requiredAttr}
          >
        `;
        break;
        
      case 'select':
        const optionsHtml = options.map(opt => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return `<option value="${value}">${label}</option>`;
        }).join('');
        
        inputHtml = `
          <select id="${fieldId}" name="${name}" class="f3-form-control" ${requiredAttr}>
            <option value="">Select...</option>
            ${optionsHtml}
          </select>
        `;
        break;
        
      case 'textarea':
        inputHtml = `
          <textarea 
            id="${fieldId}" 
            name="${name}" 
            class="f3-form-control" 
            placeholder="${placeholder}"
            rows="3"
            ${requiredAttr}
          ></textarea>
        `;
        break;
        
      case 'checkbox':
        inputHtml = `
          <div class="f3-checkbox-wrapper">
            <input 
              type="checkbox" 
              id="${fieldId}" 
              name="${name}" 
              class="f3-form-checkbox"
              ${requiredAttr}
            >
            <label for="${fieldId}" class="f3-checkbox-label">${label}</label>
          </div>
        `;
        break;
        
      case 'radio':
        const radioHtml = options.map(opt => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const radioId = `${fieldId}_${value}`;
          return `
            <div class="f3-radio-option">
              <input type="radio" id="${radioId}" name="${name}" value="${value}" class="f3-form-radio">
              <label for="${radioId}" class="f3-radio-label">${optLabel}</label>
            </div>
          `;
        }).join('');
        
        inputHtml = `<div class="f3-radio-group">${radioHtml}</div>`;
        break;
        
      case 'file':
        inputHtml = `
          <input 
            type="file" 
            id="${fieldId}" 
            name="${name}" 
            class="f3-form-control f3-form-file"
            accept="image/*"
            ${requiredAttr}
          >
          <div class="f3-file-preview" style="display: none;">
            <img class="f3-file-preview-img" alt="Preview">
            <button type="button" class="f3-file-remove">Remove</button>
          </div>
        `;
        break;
    }

    return `
      <div class="f3-form-group" data-field="${name}" style="grid-column: span ${colspan};">
        ${type !== 'checkbox' ? `
          <label for="${fieldId}" class="f3-form-label">
            ${label} ${requiredMark}
          </label>
        ` : ''}
        
        <div class="f3-form-input-wrapper">
          ${inputHtml}
        </div>
        
        ${helpText ? `<div class="f3-form-help">${helpText}</div>` : ''}
        <div class="f3-form-error" style="display: none;"></div>
      </div>
    `;
  }

  /**
   * Attach form event listeners
   */
  attachFormEvents(formElement) {
    const form = formElement.querySelector('.f3-form');
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Button actions
    formElement.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleAction(action, e);
      }
    });

    // Field validation on change
    if (this.config.validateOnChange) {
      form.addEventListener('change', (e) => {
        if (e.target.matches('.f3-form-control, .f3-form-checkbox, .f3-form-radio')) {
          this.validateField(e.target);
        }
      });

      form.addEventListener('input', (e) => {
        if (e.target.matches('.f3-form-control')) {
          this.clearFieldError(e.target);
        }
      });
    }

    // File input handling
    form.addEventListener('change', (e) => {
      if (e.target.type === 'file') {
        this.handleFileChange(e.target);
      }
    });

    // Auto-save functionality
    if (this.config.autoSave) {
      form.addEventListener('input', this.debounce(() => {
        this.autoSave();
      }, 1000));
    }
  }

  /**
   * Handle form actions
   */
  async handleAction(action, event) {
    switch (action) {
      case 'submit':
        await this.handleSubmit();
        break;
      case 'cancel':
        this.handleCancel();
        break;
      case 'delete':
        await this.handleDelete();
        break;
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.showStatus('Saving...', 'info');

    try {
      // Validate all fields
      const isValid = this.validateForm();
      if (!isValid) {
        this.showStatus('Please fix the errors above', 'error');
        return;
      }

      // Collect form data
      const formData = this.collectFormData();
      
      // Merge with existing person data
      const personData = this.currentPerson ? 
        { ...this.currentPerson, data: { ...this.currentPerson.data, ...formData } } :
        { id: this.generateId(), data: formData, rels: {} };

      // Call submit handler
      if (this.config.onSubmit) {
        await this.config.onSubmit(personData, !this.currentPerson);
      }

      this.showStatus('Saved successfully!', 'success');
      
      // Clear form if adding new person
      if (!this.currentPerson) {
        this.resetForm();
      }

    } catch (error) {
      console.error('Form submission error:', error);
      this.showStatus('Failed to save. Please try again.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Handle form cancellation
   */
  handleCancel() {
    if (this.config.onCancel) {
      this.config.onCancel();
    } else {
      this.resetForm();
    }
  }

  /**
   * Handle person deletion
   */
  async handleDelete() {
    if (!this.currentPerson) return;

    const confirmed = confirm('Are you sure you want to delete this person? This action cannot be undone.');
    if (!confirmed) return;

    try {
      this.showStatus('Deleting...', 'info');

      if (this.config.api) {
        await this.config.api.deletePerson(this.currentPerson.id);
      }

      this.showStatus('Person deleted successfully', 'success');
      
      if (this.config.onCancel) {
        this.config.onCancel();
      }

    } catch (error) {
      console.error('Delete error:', error);
      this.showStatus('Failed to delete person', 'error');
    }
  }

  /**
   * Populate form with existing data
   */
  populateForm(formElement) {
    if (!this.currentPerson) return;

    const form = formElement.querySelector('.f3-form');
    const inputs = form.querySelectorAll('.f3-form-control, .f3-form-checkbox, .f3-form-radio');

    inputs.forEach(input => {
      const value = this.currentPerson.data[input.name];
      if (value !== undefined) {
        if (input.type === 'checkbox') {
          input.checked = !!value;
        } else if (input.type === 'radio') {
          input.checked = input.value === value;
        } else {
          input.value = value;
        }
      }
    });
  }

  /**
   * Collect form data
   */
  collectFormData() {
    const form = this.currentForm.querySelector('.f3-form');
    const formData = new FormData(form);
    const data = {};

    // Process regular form fields
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Process checkboxes (not included in FormData if unchecked)
    const checkboxes = form.querySelectorAll('.f3-form-checkbox');
    checkboxes.forEach(checkbox => {
      data[checkbox.name] = checkbox.checked;
    });

    return data;
  }

  /**
   * Validate entire form
   */
  validateForm() {
    const form = this.currentForm.querySelector('.f3-form');
    const inputs = form.querySelectorAll('.f3-form-control, .f3-form-checkbox, .f3-form-radio');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Validate individual field
   */
  validateField(input) {
    const fieldGroup = input.closest('.f3-form-group');
    const fieldName = fieldGroup.dataset.field;
    const value = this.getInputValue(input);
    
    // Required validation
    if (input.hasAttribute('required') && !value) {
      this.showFieldError(fieldGroup, 'This field is required');
      return false;
    }

    // Type-specific validation
    if (value) {
      const errors = this.validateFieldType(input, value);
      if (errors.length > 0) {
        this.showFieldError(fieldGroup, errors[0]);
        return false;
      }
    }

    // Custom validation
    if (this.validators[fieldName]) {
      const error = this.validators[fieldName](value);
      if (error) {
        this.showFieldError(fieldGroup, error);
        return false;
      }
    }

    this.clearFieldError(fieldGroup);
    return true;
  }

  /**
   * Validate field by type
   */
  validateFieldType(input, value) {
    const errors = [];

    switch (input.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Please enter a valid email address');
        }
        break;
        
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push('Please enter a valid URL');
        }
        break;
        
      case 'tel':
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) {
          errors.push('Please enter a valid phone number');
        }
        break;
        
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push('Please enter a valid date');
        }
        break;
    }

    return errors;
  }

  /**
   * Get input value handling different input types
   */
  getInputValue(input) {
    if (input.type === 'checkbox') {
      return input.checked;
    } else if (input.type === 'radio') {
      const form = input.closest('form');
      const checked = form.querySelector(`input[name="${input.name}"]:checked`);
      return checked ? checked.value : '';
    } else {
      return input.value.trim();
    }
  }

  /**
   * Show field error
   */
  showFieldError(fieldGroup, message) {
    const errorElement = fieldGroup.querySelector('.f3-form-error');
    const inputWrapper = fieldGroup.querySelector('.f3-form-input-wrapper');
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    fieldGroup.classList.add('f3-form-group-error');
    inputWrapper.classList.add('f3-form-input-error');
  }

  /**
   * Clear field error
   */
  clearFieldError(fieldGroupOrInput) {
    const fieldGroup = fieldGroupOrInput.closest ? 
      fieldGroupOrInput.closest('.f3-form-group') : fieldGroupOrInput;
    
    const errorElement = fieldGroup.querySelector('.f3-form-error');
    const inputWrapper = fieldGroup.querySelector('.f3-form-input-wrapper');
    
    errorElement.style.display = 'none';
    fieldGroup.classList.remove('f3-form-group-error');
    inputWrapper.classList.remove('f3-form-input-error');
  }

  /**
   * Handle file input changes
   */
  handleFileChange(input) {
    const file = input.files[0];
    const preview = input.parentNode.querySelector('.f3-file-preview');
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = preview.querySelector('.f3-file-preview-img');
        img.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusElement = this.currentForm.querySelector('.f3-form-status');
    statusElement.textContent = message;
    statusElement.className = `f3-form-status f3-status-${type}`;
    statusElement.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    if (!this.currentForm) return;

    const form = this.currentForm.querySelector('.f3-form');
    form.reset();
    
    // Clear all errors
    const errorElements = form.querySelectorAll('.f3-form-error');
    errorElements.forEach(el => el.style.display = 'none');
    
    const errorGroups = form.querySelectorAll('.f3-form-group-error');
    errorGroups.forEach(group => group.classList.remove('f3-form-group-error'));
    
    const errorInputs = form.querySelectorAll('.f3-form-input-error');
    errorInputs.forEach(input => input.classList.remove('f3-form-input-error'));

    // Hide status
    const statusElement = form.querySelector('.f3-form-status');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  /**
   * Auto-save form data
   */
  async autoSave() {
    if (!this.currentPerson || this.isSubmitting) return;

    try {
      const formData = this.collectFormData();
      const personData = { ...this.currentPerson, data: { ...this.currentPerson.data, ...formData } };
      
      if (this.config.api) {
        await this.config.api.updatePerson(personData.id, personData);
        this.showStatus('Auto-saved', 'success');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Add custom field validator
   */
  addValidator(fieldName, validatorFunction) {
    this.validators[fieldName] = validatorFunction;
  }

  /**
   * Remove custom field validator
   */
  removeValidator(fieldName) {
    delete this.validators[fieldName];
  }

  /**
   * Get default form fields
   */
  getDefaultFields() {
    return [
      {
        name: 'first name',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      },
      {
        name: 'last name',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'M', label: 'Male' },
          { value: 'F', label: 'Female' }
        ]
      },
      {
        name: 'birthday',
        label: 'Birth Date',
        type: 'date'
      },
      {
        name: 'avatar',
        label: 'Photo URL',
        type: 'url',
        placeholder: 'https://example.com/photo.jpg'
      },
      {
        name: 'profession',
        label: 'Profession',
        type: 'text',
        placeholder: 'Enter profession'
      },
      {
        name: 'location',
        label: 'Location',
        type: 'text',
        placeholder: 'Enter location'
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Additional information...'
      }
    ];
  }

  /**
   * Create a relationship form
   */
  createRelationshipForm(person1, person2, container) {
    const relationshipFields = [
      {
        name: 'relationship_type',
        label: 'Relationship Type',
        type: 'select',
        required: true,
        options: [
          { value: 'spouse', label: 'Spouse' },
          { value: 'child', label: 'Child' },
          { value: 'parent', label: 'Parent' },
          { value: 'sibling', label: 'Sibling' }
        ]
      },
      {
        name: 'start_date',
        label: 'Relationship Start Date',
        type: 'date',
        helpText: 'Optional: When did this relationship begin?'
      },
      {
        name: 'end_date',
        label: 'Relationship End Date',
        type: 'date',
        helpText: 'Optional: When did this relationship end?'
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Additional details about this relationship...'
      }
    ];

    return this.createForm({
      container,
      fields: relationshipFields,
      title: `Create Relationship`,
      submitText: 'Create Relationship',
      showDelete: false
    });
  }

  /**
   * Create a quick add form with minimal fields
   */
  createQuickAddForm(container, relationshipData = null) {
    const quickFields = [
      {
        name: 'first name',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      },
      {
        name: 'last name',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'radio',
        required: true,
        options: [
          { value: 'M', label: 'Male' },
          { value: 'F', label: 'Female' }
        ]
      }
    ];

    // Add relationship field if provided
    if (relationshipData) {
      quickFields.push({
        name: 'relationship_to_target',
        label: `Relationship to ${relationshipData.targetName}`,
        type: 'select',
        required: true,
        options: [
          { value: 'spouse', label: 'Spouse' },
          { value: 'child', label: 'Child' },
          { value: 'parent', label: 'Parent' },
          { value: 'sibling', label: 'Sibling' }
        ]
      });
    }

    return this.createForm({
      container,
      fields: quickFields,
      title: 'Quick Add Person',
      submitText: 'Add Person',
      layout: 'compact'
    });
  }

  /**
   * Debounce function for auto-save
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
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
   * Export form data as JSON
   */
  exportFormData() {
    return JSON.stringify(this.collectFormData(), null, 2);
  }

  /**
   * Import form data from JSON
   */
  importFormData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      this.populateFormWithData(data);
    } catch (error) {
      console.error('Failed to import form data:', error);
      throw new Error('Invalid JSON data');
    }
  }

  /**
   * Populate form with arbitrary data
   */
  populateFormWithData(data) {
    if (!this.currentForm) return;

    const form = this.currentForm.querySelector('.f3-form');
    const inputs = form.querySelectorAll('.f3-form-control, .f3-form-checkbox, .f3-form-radio');

    inputs.forEach(input => {
      const value = data[input.name];
      if (value !== undefined) {
        if (input.type === 'checkbox') {
          input.checked = !!value;
        } else if (input.type === 'radio') {
          input.checked = input.value === value;
        } else {
          input.value = value;
        }
      }
    });
  }

  /**
   * Get form validation state
   */
  getValidationState() {
    const form = this.currentForm.querySelector('.f3-form');
    const inputs = form.querySelectorAll('.f3-form-control, .f3-form-checkbox, .f3-form-radio');
    const state = {
      isValid: true,
      errors: {},
      fields: {}
    };

    inputs.forEach(input => {
      const fieldGroup = input.closest('.f3-form-group');
      const fieldName = fieldGroup.dataset.field;
      const value = this.getInputValue(input);
      
      state.fields[fieldName] = {
        value,
        isValid: this.validateField(input),
        element: input
      };

      if (!state.fields[fieldName].isValid) {
        state.isValid = false;
        const errorElement = fieldGroup.querySelector('.f3-form-error');
        state.errors[fieldName] = errorElement.textContent;
      }
    });

    return state;
  }

  /**
   * Set form read-only mode
   */
  setReadOnly(readOnly = true) {
    if (!this.currentForm) return;

    const form = this.currentForm.querySelector('.f3-form');
    const inputs = form.querySelectorAll('.f3-form-control, .f3-form-checkbox, .f3-form-radio');
    const submitBtn = form.querySelector('[data-action="submit"]');

    inputs.forEach(input => {
      input.disabled = readOnly;
    });

    if (submitBtn) {
      submitBtn.disabled = readOnly;
    }

    this.currentForm.classList.toggle('f3-form-readonly', readOnly);
  }

  /**
   * Destroy the form builder
   */
  destroy() {
    if (this.currentForm) {
      this.currentForm.remove();
      this.currentForm = null;
    }
    this.formData = {};
    this.validators = {};
  }
}

export default FormBuilder;