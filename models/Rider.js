import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  email: { type: String, required: true, unique: true },
  nid: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });

const Rider = mongoose.model('Rider', riderSchema);
export default Rider;