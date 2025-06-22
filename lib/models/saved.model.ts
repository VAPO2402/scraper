import mongoose from "mongoose";

const savedProductSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  savedAt: { type: Date, default: Date.now },
});

const SavedProduct = mongoose.models.SavedProduct || mongoose.model("SavedProduct", savedProductSchema);

export default SavedProduct;