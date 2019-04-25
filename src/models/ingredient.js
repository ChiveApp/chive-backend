import { Schema, model } from "mongoose";

export const ingredientSchema = new Schema(
  {
    name: {
      type: String,
      required: false
    },
    quantity: {
      type: String,
      required: false
    },
    unit: {
      type: String,
      required: false
    }
  },
  {
    collection: "ingredients"
  }
);

export default model("Ingredient", ingredientSchema);
