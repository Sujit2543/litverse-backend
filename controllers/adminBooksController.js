import Book from "../models/Book.js";

export const getAllBooks = async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json(books);
};

export const addBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.json({ message: "Book added successfully", newBook });
  } catch (err) {
    res.status(500).json({ message: "Error adding book" });
  }
};

export const updateBook = async (req, res) => {
  try {
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating book" });
  }
};

export const deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting book" });
  }
};
