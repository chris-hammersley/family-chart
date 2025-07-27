<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/donatso/family-chart">
    <img src="examples/logo.svg" alt="Logo" width="80" height="50">
  </a>

<h3 align="center">Family Chart</h3>

  <p align="center">
    Create beautiful, interactive family trees with this powerful D3.js-based visualization library
    <br />
    <a href="https://github.com/donatso/family-chart"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://donatso.github.io/family-chart-doc/wiki-tree?wiki_id=Q43274">View Demo</a>
    ·
    <a href="https://github.com/donatso/family-chart/issues">Report Bug</a>
    ·
    <a href="https://github.com/donatso/family-chart/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://donatso.github.io/family-chart-doc/wiki-tree/?wiki_id=Q43274)

Family Chart is a powerful D3.js-based visualization library for creating beautiful, interactive family trees. The library offers:

- **Example-based Learning**: Explore pre-built examples and customize them to match your needs
- **Create from Scratch**: Build your family tree from the ground up with an intuitive interface
- **Full Customization**: Complete control over your tree's structure and styling
- **Interactive Features**: Built-in interactivity


<!-- GETTING STARTED -->
## Getting Started

### MongoDB & UUID Setup (Required)

Family Chart now uses MongoDB as the only data source for all examples and runtime usage. You must have a MongoDB instance running (local or cloud, e.g. MongoDB Atlas).

Additionally, you must install the `uuid` package for unique ID generation:

```bash
npm install uuid
```

#### MongoDB Setup
1. Create a `.env.local` file in the project root with:
   ```
   MONGODB_URI=mongodb://localhost:27017/familychart
   ```
   (or use your Atlas connection string)
2. Install dependencies:
   ```bash
   npm install
   npm install mongoose
   npm install uuid
   ```
3. Start your MongoDB server if running locally.
4. Run the app as usual (e.g. `npm run dev` for Next.js or Vite).

### 1. Prerequisites

- **Node.js** (v20+ required)
- **MongoDB** (local or cloud, e.g. MongoDB Atlas)
- **uuid** npm package

---

## Getting Started from Blank Node (React/Next.js Integration)

Follow these steps to integrate the Family Chart library and its create-tree functionality into a new or existing React/Next.js project:

### 1. Install Dependencies

```bash
npm install family-chart mongoose uuid
```

### 2. Set Up MongoDB Connection

Create a `.env.local` file in your project root:

```
MONGODB_URI=mongodb://localhost:27017/familychart
```

Or use your MongoDB Atlas connection string.

### 3. Create the API Route (Next.js Example)

Create a file at `pages/api/family/[honoreeId]/person.js`:

```js
import dbConnect from '../../../lib/dbConnect';
import Person from '../../../models/Person';

export default async function handler(req, res) {
  await dbConnect();
  const { honoreeId } = req.query;
  if (req.method === 'GET') {
    const people = await Person.find({ honoreeId });
    res.status(200).json(people);
  } else if (req.method === 'POST') {
    const person = new Person({ ...req.body, honoreeId });
    await person.save();
    res.status(201).json(person);
  } // Add PUT/DELETE as needed
}
```

### 4. Add the Family Chart Component

Create a component (e.g. `components/FamilyTreeChart.jsx`):

```jsx
import { useEffect, useRef } from 'react';
import f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';

const FamilyTreeChart = ({ honoreeId, data, user }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    f3.createChart({
      cont: containerRef.current,
      data,
      honoreeId,
      authContext: { userId: user?._id, token: user?.accessToken }
    });
  }, [data, honoreeId, user]);

  return <div ref={containerRef} className="f3 f3-cont w-full h-full" />;
};

export default FamilyTreeChart;
```

### 5. Use the Component in Your Page

```jsx
import FamilyTreeChart from '../components/FamilyTreeChart';

export default function Home({ data, user, honoreeId }) {
  return <FamilyTreeChart data={data} user={user} honoreeId={honoreeId} />;
}
```

### 6. Enable Create-Tree Functionality

To allow users to add/edit people, ensure you pass the correct `honoreeId` and `authContext` props, and that your API endpoints are set up as above. The chart will handle all data writes via the `/api/family/[honoreeId]/person` endpoint.

---

## MongoDB API Usage

All example and demo code now fetches data from `/api/family` (GET for read, POST for create, PUT for update, DELETE for remove). See the example `index.js` files for usage patterns.

**Note:** Local `.json` files are no longer used for runtime data. All data is persisted in MongoDB.


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.


<!-- CONTACT -->
## Contact

Project Link: [https://github.com/donatso/family-chart](https://github.com/donatso/family-chart)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/donatso/family-chart.svg?style=for-the-badge
[contributors-url]: https://github.com/donatso/family-chart/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/donatso/family-chart.svg?style=for-the-badge
[forks-url]: https://github.com/donatso/family-chart/network/members
[stars-shield]: https://img.shields.io/github/stars/donatso/family-chart.svg?style=for-the-badge
[stars-url]: https://github.com/donatso/family-chart/stargazers
[issues-shield]: https://img.shields.io/github/issues/donatso/family-chart.svg?style=for-the-badge
[issues-url]: https://github.com/donatso/family-chart/issues
[license-shield]: https://img.shields.io/github/license/donatso/family-chart.svg?style=for-the-badge
[license-url]: https://github.com/donatso/family-chart/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/donat-sorić-342a92161
[product-screenshot]: https://github.com/user-attachments/assets/a4f8a9c0-c327-45fa-90bc-23d73578a304
[product-basic-tree-screenshot]: https://github.com/user-attachments/assets/7e231e53-9230-49f9-ae93-8125096237dc
[product-wiki-tree-screenshot]: https://github.com/user-attachments/assets/4e2dc169-4b43-46f3-b31c-db17f4d489da
[create-tree-screenshot]: https://github.com/user-attachments/assets/ce5c4b33-48dd-441c-aa2f-f581b57ddcb7

