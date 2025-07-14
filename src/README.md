# Family Chart with MongoDB Integration

A powerful D3.js-based family tree visualization library with MongoDB backend support.

## Installation

```bash
npm install @yourusername/family-chart-mongodb
# or
yarn add @yourusername/family-chart-mongodb
```

## Quick Start

### Basic Usage (JSON data)
```javascript
import f3 from '@yourusername/family-chart-mongodb';
import '@yourusername/family-chart-mongodb/dist/styles/family-chart.css';

// Create chart with local data
const chart = f3.createChart('#family-tree-container', data);
const card = chart.setCard(f3.CardHtml);
chart.updateTree({ initial: true });
```

### MongoDB Integration
```javascript
import f3 from '@yourusername/family-chart-mongodb';

// Create chart with API configuration
const chart = f3.createChart('#family-tree-container', [], {
  apiConfig: {
    baseUrl: '/api',
    familyId: 'your-family-id',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  },
  autoSave: true // Automatically save changes to API
});

// Load family data from MongoDB
await chart.loadFromApi();

// Set up the card component
const card = chart.setCard(f3.CardHtml)
  .setStyle('imageRect')
  .setCardDisplay([
    d => `${d['first name']} ${d['last name']}`,
    d => d.birthday
  ]);

// Enable editing
const editTree = chart.editTree()
  .setFields([
    'first name',
    'last name', 
    'birthday',
    'avatar'
  ]);

chart.updateTree({ initial: true });
```

### React.js Example
```javascript
import React, { useEffect, useRef } from 'react';
import f3 from '@yourusername/family-chart-mongodb';
import '@yourusername/family-chart-mongodb/dist/styles/family-chart.css';

function FamilyTree({ familyId }) {
  const containerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    // Initialize chart
    chartRef.current = f3.createChart(containerRef.current, [], {
      apiConfig: {
        baseUrl: '/api',
        familyId: familyId
      },
      autoSave: true
    });

    // Set up card component
    const card = chartRef.current.setCard(f3.CardHtml)
      .setStyle('imageRect')
      .setCardDisplay([
        d => `${d['first name']} ${d['last name']}`,
        d => d.birthday || ''
      ]);

    // Load data and render
    chartRef.current.loadFromApi()
      .then(() => {
        chartRef.current.updateTree({ initial: true });
      })
      .catch(console.error);

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current = null;
      }
    };
  }, [familyId]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '600px' }}
    />
  );
}

export default FamilyTree;
```

### Next.js Example
```javascript
// pages/family-tree.js
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const FamilyChart = dynamic(() => import('../components/FamilyChart'), {
  ssr: false
});

export default function FamilyTreePage() {
  return (
    <div>
      <h1>Family Tree</h1>
      <FamilyChart familyId="your-family-id" />
    </div>
  );
}

// components/FamilyChart.js
import { useEffect, useRef } from 'react';

export default function FamilyChart({ familyId }) {
  const containerRef = useRef();

  useEffect(() => {
    // Import f3 only on client side
    import('@yourusername/family-chart-mongodb').then(({ default: f3 }) => {
      const chart = f3.createChart(containerRef.current, [], {
        apiConfig: {
          baseUrl: '/api',
          familyId: familyId
        }
      });

      chart.setCard(f3.CardHtml).setStyle('imageRect');
      
      chart.loadFromApi().then(() => {
        chart.updateTree({ initial: true });
      });
    });
  }, [familyId]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
}
```

### Manual API Operations
```javascript
// Create API instance
const familyApi = new f3.FamilyApi({
  baseUrl: '/api',
  familyId: 'your-family-id'
});

// Load family data
const familyData = await familyApi.fetchFamily();

// Save family data
await familyApi.saveFamily(familyData);

// Add new person
const newPerson = f3.utils.createEmptyPerson({
  'first name': 'John',
  'last name': 'Doe',
  gender: 'M'
});
await familyApi.addPerson(newPerson);

// Find and update a person
const person = f3.utils.findPersonById(familyData, 'person-id');
if (person) {
  person.data.birthday = '1990-01-01';
  await familyApi.updatePerson(person.id, person);
}
```

## API Requirements

Your backend API should provide these endpoints:

```
GET    /api/family/:familyId           - Get family tree data
PUT    /api/family/:familyId           - Save entire family tree
POST   /api/family/:familyId/person    - Add new person
PUT    /api/family/:familyId/person/:personId - Update person
DELETE /api/family/:familyId/person/:personId - Delete person
POST   /api/family/:familyId/batch     - Batch operations (optional)
```

### Example API Response Format
```javascript
// GET /api/family/123 should return:
[
  {
    "id": "person-1",
    "data": {
      "first name": "John",
      "last name": "Doe",
      "gender": "M",
      "birthday": "1990-01-01",
      "avatar": "https://example.com/photo.jpg"
    },
    "rels": {
      "father": "person-2",
      "mother": "person-3",
      "spouses": ["person-4"],
      "children": ["person-5", "person-6"]
    }
  }
  // ... more family members
]
```

## Data Format

The library expects person objects in this format:

```javascript
{
  "id": "unique-person-id",           // Required: Unique identifier
  "data": {                          // Required: Person information
    "first name": "John",            // Optional: First name
    "last name": "Doe",              // Optional: Last name  
    "gender": "M",                   // Optional: "M", "F", or undefined
    "birthday": "1990-01-01",        // Optional: Birth date
    "avatar": "https://...",         // Optional: Photo URL
    // ... any other custom fields
  },
  "rels": {                          // Required: Relationships
    "father": "father-id",           // Optional: Father's ID
    "mother": "mother-id",           // Optional: Mother's ID
    "spouses": ["spouse-id"],        // Optional: Array of spouse IDs
    "children": ["child-1", "child-2"] // Optional: Array of children IDs
  }
}
```

## Configuration Options

```javascript
const chart = f3.createChart(container, data, {
  // API Configuration
  apiConfig: {
    baseUrl: '/api',           // API base URL
    familyId: 'family-id',     // Family identifier
    headers: {                 // Additional headers
      'Authorization': 'Bearer token'
    }
  },
  
  // Chart Options
  autoSave: true,              // Auto-save to API on changes
  node_separation: 250,        // Horizontal spacing between cards
  level_separation: 150,       // Vertical spacing between levels
  transition_time: 2000,       // Animation duration in ms
  
  // Tree Options
  single_parent_empty_card: true,  // Show empty cards for missing parents
  is_horizontal: false,        // Horizontal vs vertical layout
  show_siblings_of_main: false // Show siblings of main person
});
```

## Utility Functions

```javascript
// Generate unique IDs
const personId = f3.utils.createPersonId();

// Create new person
const newPerson = f3.utils.createEmptyPerson({
  'first name': 'Jane',
  'last name': 'Smith',
  gender: 'F'
});

// Validate person data
f3.utils.validatePersonData(person); // throws error if invalid

// Find person in family data
const person = f3.utils.findPersonById(familyData, 'person-id');

// Get family relationships
const children = f3.utils.getChildren(familyData, 'parent-id');
const parents = f3.utils.getParents(familyData, 'child-id');
```

## Styling

Import the CSS file in your application:

```javascript
// ES6 modules
import '@yourusername/family-chart-mongodb/dist/styles/family-chart.css';

// CommonJS
require('@yourusername/family-chart-mongodb/dist/styles/family-chart.css');
```

Or include it in your HTML:

```html
<link rel="stylesheet" href="node_modules/@yourusername/family-chart-mongodb/dist/styles/family-chart.css">
```

### Custom Styling
You can override the default styles by targeting the CSS classes:

```css
/* Customize card colors */
.f3 .card-male .card-inner {
  background-color: #4a90e2;
}

.f3 .card-female .card-inner {
  background-color: #e24a90;
}

/* Customize card dimensions */
.f3 .card-inner {
  width: 200px;
  height: 80px;
}
```

## Error Handling

```javascript
try {
  const chart = f3.createChart('#container', [], {
    apiConfig: { baseUrl: '/api', familyId: 'family-1' }
  });
  
  await chart.loadFromApi();
  chart.updateTree({ initial: true });
} catch (error) {
  console.error('Failed to load family tree:', error);
  // Handle error (show message to user, fallback to local data, etc.)
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Examples

See the `/examples` directory for complete implementation examples including:
- Basic family tree with local data
- MongoDB integration with authentication
- Custom card styling
- Advanced editing features
- React.js integration
- Next.js integration

## License

MIT License - see LICENSE.txt for details.# Family Chart with MongoDB Integration

A powerful D3.js-based family tree visualization library with MongoDB backend support.

## Installation

```bash
npm install @yourusername/family-chart-mongodb
# or
yarn add @yourusername/family-chart-mongodb
```

## Quick Start

### Basic Usage (JSON data)
```javascript
import f3 from '@yourusername/family-chart-mongodb';
import '@yourusername/family-chart-mongodb/dist/styles/family-chart.css';

// Create chart with local data
const chart = f3.createChart('#family-tree-container', data);
const card = chart.setCard(f3.CardHtml);
chart.updateTree({ initial: true });
```

### MongoDB Integration
```javascript
import f3 from '@yourusername/family-chart-mongodb';

// Create chart with API configuration
const chart = f3.createChart('#family-tree-container', [], {
  apiConfig: {
    baseUrl: '/api',
    familyId: 'your-family-id',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  },
  autoSave: true // Automatically save changes to API
});

// Load family data from MongoDB
await chart.loadFromApi();

// Set up the card component
const card = chart.setCard(f3.CardHtml)
  .setStyle('imageRect')
  .setCardDisplay([
    d => `${d['first name']} ${d['last name']}`,
    d => d.birthday
  ]);

// Enable editing
const editTree = chart.editTree()
  .setFields([
    'first name',
    'last name', 
    'birthday',
    'avatar'
  ]);

chart.updateTree({ initial: true });
```

### Manual API Operations
```javascript
// Create API instance
const familyApi = new f3.FamilyApi({
  baseUrl: '/api',
  familyId: 'your-family-id'
});

// Load family data
const familyData = await familyApi.fetchFamily();

// Save family data
await familyApi.saveFamily(familyData);

// Add new person
const newPerson = f3.utils.createEmptyPerson({
  'first name': 'John',
  'last name': 'Doe',
  gender: 'M'
});
await familyApi.addPerson(newPerson);
```

## API Requirements

Your backend API should provide these endpoints:

```
GET    /api/family/:familyId           - Get family tree data
PUT    /api/family/:familyId           - Save entire family tree
POST   /api/family/:familyId/person    - Add new person
PUT    /api/family/:familyId/person/:personId - Update person
DELETE /api/family/:familyId/person/:personId - Delete person
POST   /api/family/:familyId/batch     - Batch operations
```

## Data Format

The library expects person objects in this format:

```javascript
{
  "id": "unique-person-id",
  "data": {
    "first name": "John",
    "last name": "Doe", 
    "gender": "M",
    "birthday": "1990-01-01",
    "avatar": "https://example.com/photo.jpg"
  },
  "rels": {
    "father": "father-id",
    "mother": "mother-id", 
    "spouses": ["spouse-id"],
    "children": ["child-id-1", "child-id-2"]
  }
}
```

## Configuration Options

```javascript
const chart = f3.createChart(container, data, {
  apiConfig: {
    baseUrl: '/api',           // API base URL
    familyId: 'family-id',     // Family identifier
    headers: {}                // Additional headers
  },
  autoSave: true,              // Auto-save to API
  node_separation: 250,        // Horizontal spacing
  level_separation: 150,       // Vertical spacing
  transition_time: 2000        // Animation duration
});
```

## Styling

Import the CSS file:

```javascript
import '@yourusername/family-chart-mongodb/dist/styles/family-chart.css';
```

Or include it in your HTML:

```html
<link rel="stylesheet" href="node_modules/@yourusername/family-chart-mongodb/dist/styles/family-chart.css">
```

## TypeScript Support

The library includes TypeScript definitions:

```typescript
import f3, { Person, ApiConfig, ChartConfig } from '@yourusername/family-chart-mongodb';

const config: ChartConfig = {
  apiConfig: {
    baseUrl: '/api',
    familyId: 'my-family'
  }
};

const chart = f3.createChart('#container', [], config);
```

## Examples

See the `/examples` directory for complete implementation examples including:
- Basic family tree
- MongoDB integration
- Custom styling
- Advanced editing features

## License

MIT License - see LICENSE.txt for details.
