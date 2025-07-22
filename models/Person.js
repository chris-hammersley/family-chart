import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema({
  id: String,
  name: String,
  // Add all other fields as needed from your data model
  // e.g. birth, death, parents, children, etc.
}, { timestamps: true });

export default mongoose.models.Person || mongoose.model("Person", PersonSchema);
