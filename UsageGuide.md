
# Family Chart Usage Guide for Next.js + React

## Installation & Configuration

### 1. Prerequisites

- **Node.js** (v16+ recommended)
- **MongoDB** (local or cloud, e.g. MongoDB Atlas)

### 2. Clone and Install

```bash
git clone <your-fork-or-repo-url>
cd family-chart
npm install
npm install mongoose
```

### 3. Configure MongoDB Connection

Create a `.env.local` file in the project root:

```
MONGODB_URI=mongodb://localhost:27017/familychart
```

Or use your MongoDB Atlas connection string.

### 4. Start MongoDB

If running locally, ensure your MongoDB server is running:

```bash
mongod
```

### 5. Start the App

For Next.js:

```bash
npm run dev
```

For Vite or other setups, use the appropriate start command.

---

## 1. Overview

**Family Chart** is a JavaScript library for rendering interactive family trees. It supports custom card layouts, dynamic data, and flexible UI configuration. The library is modular and can be integrated into modern frameworks like React and Next.js.

---

## 2. How the Library Works

### Inputs

- **Data**: Family tree data, typically as an array of person objects and relationship links. See `/examples/create-tree/data.json` for structure.
- **Config**: Options for customizing cards, tree layout, and UI elements.
- **Handlers**: Optional callbacks for user actions (e.g., card click, edit).

### Outputs

- **DOM Elements**: The chart renders into a specified container.
- **Events**: Custom events for user interactions (e.g., node select, zoom).

### Core API

- `createChart(container, data, config)`: Main function to render the chart.
- `createStore(data)`: Initializes the data store for the chart.

---

## 3. Deploying as a React Component in Next.js

### Step 1: Install Dependencies

Install D3 and any other required packages:

```bash
npm install d3
```

Copy the Family Chart source files (from `/src` and relevant `/examples/create-tree/elements`) into your Next.js project, e.g., under `/lib/family-chart`.

### Step 2: Create a React Wrapper

```jsx
// components/FamilyChart.js
import { useEffect, useRef } from "react";
import { createChart } from "../lib/family-chart/createChart"; // adjust path as needed

export default function FamilyChart({ data, config }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current && data) {
      createChart(chartRef.current, data, config);
    }
  }, [data, config]);

  return <div ref={chartRef} style={{ width: "100%", height: "600px" }} />;
}
```

### Step 3: Use in a Next.js Page

```jsx
// pages/index.js
import FamilyChart from "../components/FamilyChart";
import sampleData from "../data/family.json"; // or fetch from API

export default function Home() {
  const config = {
    // ...custom config (see below)
  };

  return (
    <div>
      <h1>Family Tree</h1>
      <FamilyChart data={sampleData} config={config} />
    </div>
  );
}
```

---


---

## 4. What to Expect on First Use

When you launch the app for the first time:

- **Database is Empty:** If your MongoDB collection is empty, the UI will show an empty or starter tree. You can add your first person or family member using the UI (see `/examples/create-tree` for inspiration).
- **Adding Data:** Use the provided forms or UI controls to add people, relationships, and details. All changes are saved directly to MongoDB via the `/api/family` endpoint.
- **Live Updates:** As you add or edit nodes, the tree updates in real time. All data is persisted in the database.
- **No Static Files:** All data is loaded from and saved to MongoDB. Local `.json` files are not used at runtime.
- **API-Driven:** All reads/writes go through the `/api/family` API, which uses Mongoose for schema validation and persistence.

---

### Step 1: Set Up MongoDB and Mongoose

Install Mongoose:

```bash
npm install mongoose
```

### Step 2: Create a Mongoose Model

```js
// models/Person.js
import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema({
  id: String,
  name: String,
  // ...other fields as in your data.json
});

export default mongoose.models.Person || mongoose.model("Person", PersonSchema);
```

### Step 3: Create an API Route in Next.js

```js
// pages/api/family.js
import dbConnect from "../../lib/dbConnect";
import Person from "../../models/Person";

export default async function handler(req, res) {
  await dbConnect();
  const people = await Person.find({});
  res.status(200).json(people);
}
```

`dbConnect` is a utility to connect to MongoDB (see [Next.js docs](https://nextjs.org/docs/pages/building-your-application/data-fetching/connecting-to-databases)).

### Step 4: Fetch Data in Your Page

```js
// pages/index.js
import FamilyChart from "../components/FamilyChart";

export async function getServerSideProps() {
  const res = await fetch("http://localhost:3000/api/family");
  const data = await res.json();
  return { props: { data } };
}

export default function Home({ data }) {
  // ...same as before
}
```

---

## 5. First-Time Use: `/examples/create-tree`

- **Purpose**: Demonstrates how to build a tree interactively and edit nodes.
- **Key Files**: `create-tree.js`, `elements/Display.js`, `elements/Edit.js`
- **How to Use**: Use the provided UI to add/edit/remove people and relationships. The structure of the data here is a good template for your MongoDB schema.

---

## 6. API Configuration Example: `/examples/9-wiki-tree`

- **Purpose**: Shows how to fetch and display data from an external API (e.g., Wikipedia).
- **Key Files**: `wiki-tree.js`, `wiki-data.handleWikiData.js`, `wiki-data.search.js`
- **How to Use**: Adapt the API fetching logic to your own endpoints (e.g., your MongoDB API). The pattern is:
  - Fetch data asynchronously.
  - Transform it into the format expected by `createChart`.
  - Pass it to the chart component.

---

## 7. Summary of Other Examples

| Example Folder                | Feature Highlighted                |
|-------------------------------|------------------------------------|
| 1-basic-tree                  | Minimal static tree                |
| 2-basic-tree-aristotle        | Tree with historical data          |
| 3-custom-card-tree            | Custom card layouts                |
| 4-custom-main-node            | Custom main/root node styling      |
| 5-custom-text-display         | Custom text rendering              |
| 6-html-cards                  | Cards rendered as HTML             |
| 7-custom-elements-and-actions | Custom UI elements and actions     |
| 8-zoom-to-card                | Programmatic zoom to a node        |

Each example demonstrates a different way to configure cards, layouts, or interactivity.

---

## 8. Abstracted Config File for Easy UI Modification

Create a config file to centralize UI options:

```js
// familyChartConfig.js
export default {
  card: {
    shape: "rect",
    color: "#f0f0f0",
    fields: ["name", "birth", "death"],
    customRender: null, // function for custom card rendering
  },
  tree: {
    orientation: "horizontal",
    spacing: 40,
    // ...other layout options
  },
  handlers: {
    onCardClick: (person) => {},
    onEdit: (person) => {},
    // ...other event handlers
  },
};
```

Then import and use this config in your React component.

---

## 9. Extending & Customizing

- **Custom Cards**: Use the `customRender` function in config to override card rendering.
- **Event Handlers**: Attach custom handlers for editing, selection, etc.
- **Styling**: Override or extend the default CSS (`family-chart.css`).

---

## 10. Best Practices

- **Keep data normalized** for easier updates and MongoDB integration.
- **Abstract config** for maintainability.
- **Use API routes** for dynamic data.
- **Test with static data first** (see `/examples/create-tree`), then switch to API/MongoDB.

---

## 11. References

- [Next.js Data Fetching](https://nextjs.org/docs/pages/building-your-application/data-fetching)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [D3.js](https://d3js.org/)

---

**Summary:**  
This guide covers integrating Family Chart into a Next.js app as a React component, using both static and dynamic (MongoDB) data, and provides a roadmap for configuration and extension. Use the examples as templates for your own features, and centralize UI options in a config file for easy customization.
