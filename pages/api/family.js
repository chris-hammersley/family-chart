import dbConnect from "../../lib/dbConnect";
import Person from "../../models/Person";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === "GET") {
    const people = await Person.find({});
    res.status(200).json(people);
  } else if (req.method === "POST") {
    let personData = req.body;
    if (!personData.id) {
      personData.id = uuidv4();
    }
    const person = await Person.create(personData);
    res.status(201).json(person);
  } else if (req.method === "PUT") {
    const { id, ...update } = req.body;
    const person = await Person.findOneAndUpdate({ id }, update, { new: true });
    res.status(200).json(person);
  } else if (req.method === "DELETE") {
    const { id } = req.body;
    await Person.findOneAndDelete({ id });
    res.status(204).end();
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
