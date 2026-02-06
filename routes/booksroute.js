const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../database/mongo");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function parseSort(sortParam) {
  if (!sortParam) return { _id: 1 };
  const [field, dirRaw] = String(sortParam).split(":");
  const dir = (dirRaw || "asc").toLowerCase() === "desc" ? -1 : 1;

  const allowed = new Set(["title", "author", "year", "rating", "createdAt"]);
  if (!allowed.has(field)) return { _id: 1 };

  return { [field]: dir };
}

function parseProjection(fieldsParam) {
  if (!fieldsParam) return null;
  const fields = String(fieldsParam)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const allowed = new Set([
    "title", "author", "description", "series", "seriesNumber",
    "tags", "year", "rating", "pages", "createdAt"
  ]);

  const projection = {};
  for (const f of fields) {
    if (allowed.has(f)) projection[f] = 1;
  }
  return Object.keys(projection).length ? projection : null;
}

router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection("books");

    const {
      author,
      series,
      tag,
      minRating,
      yearFrom,
      yearTo,
      sort,
      fields,
      limit
    } = req.query;

    const filter = {};

    if (author) filter.author = { $regex: String(author), $options: "i" };
    if (series) filter.series = { $regex: String(series), $options: "i" };
    if (tag) filter.tags = { $in: [String(tag)] };

    if (minRating !== undefined) {
      const mr = Number(minRating);
      if (Number.isNaN(mr)) return res.status(400).json({ error: "Invalid minRating" });
      filter.rating = { $gte: mr };
    }

    if (yearFrom !== undefined || yearTo !== undefined) {
      const yf = yearFrom !== undefined ? Number(yearFrom) : null;
      const yt = yearTo !== undefined ? Number(yearTo) : null;

      if ((yf !== null && Number.isNaN(yf)) || (yt !== null && Number.isNaN(yt))) {
        return res.status(400).json({ error: "Invalid yearFrom/yearTo" });
      }

      filter.year = {};
      if (yf !== null) filter.year.$gte = yf;
      if (yt !== null) filter.year.$lte = yt;
    }

    const sortObj = parseSort(sort);
    const projection = parseProjection(fields);

    const lim = limit !== undefined ? Number(limit) : 50;
    if (Number.isNaN(lim) || lim <= 0 || lim > 200) {
      return res.status(400).json({ error: "Invalid limit (1..200)" });
    }

    const cursor = col.find(filter, projection ? { projection } : undefined)
      .sort(sortObj)
      .limit(lim);

    const items = await cursor.toArray();
    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server/database error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection("books");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const book = await col.findOne({ _id: new ObjectId(id) });
    if (!book) return res.status(404).json({ error: "Book not found" });

    res.status(200).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server/database error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection("books");

    const {
      title,
      author,
      description = "",
      series = "",
      seriesNumber = null,
      tags = [],
      year = null,
      rating = null,
      pages = null
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing required fields: title, author" });
    }

    const doc = {
      title: String(title).trim(),
      author: String(author).trim(),
      description: String(description || ""),
      series: String(series || ""),
      seriesNumber: seriesNumber === null ? null : Number(seriesNumber),
      tags: Array.isArray(tags) ? tags.map(String) : [],
      year: year === null ? null : Number(year),
      rating: rating === null ? null : Number(rating),
      pages: pages === null ? null : Number(pages),
      createdAt: new Date()
    };

    const result = await col.insertOne(doc); 
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server/database error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection("books");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const {
      title,
      author,
      description = "",
      series = "",
      seriesNumber = null,
      tags = [],
      year = null,
      rating = null,
      pages = null
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing required fields: title, author" });
    }

    const update = {
      $set: {
        title: String(title).trim(),
        author: String(author).trim(),
        description: String(description || ""),
        series: String(series || ""),
        seriesNumber: seriesNumber === null ? null : Number(seriesNumber),
        tags: Array.isArray(tags) ? tags.map(String) : [],
        year: year === null ? null : Number(year),
        rating: rating === null ? null : Number(rating),
        pages: pages === null ? null : Number(pages)
      }
    };

    const result = await col.updateOne({ _id: new ObjectId(id) }, update);
    if (result.matchedCount === 0) return res.status(404).json({ error: "Book not found" });

    res.status(200).json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server/database error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection("books");

    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Book not found" });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server/database error" });
  }
});

module.exports = router;
