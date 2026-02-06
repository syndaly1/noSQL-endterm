const grid = document.getElementById("grid");
const q = document.getElementById("q");
const tag = document.getElementById("tag");
const sort = document.getElementById("sort");
const reloadBtn = document.getElementById("reload");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

const createForm = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

function requireLogin() {
  alert("You need to log in first.");
  window.location.href = "/login";
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function openModal(html) {
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
}

function hideModal() {
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
}

closeModal.addEventListener("click", hideModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) hideModal();
});

async function loadBooks() {
  const params = new URLSearchParams();
  params.set("limit", "60");
  params.set("sort", sort.value);
  if (tag.value) params.set("tag", tag.value);

  const res = await fetch(`/api/books?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    grid.innerHTML = `<div class="card">Failed: ${esc(data.error || "error")}</div>`;
    return;
  }

  const needle = q.value.trim().toLowerCase();
  const filtered = needle
    ? data.filter(
        (b) =>
          (b.title || "").toLowerCase().includes(needle) ||
          (b.author || "").toLowerCase().includes(needle)
      )
    : data;

  renderGrid(filtered);
}

function renderGrid(items) {
  if (!items.length) {
    grid.innerHTML = `<div class="card">No books found.</div>`;
    return;
  }

  grid.innerHTML = items
    .map((b) => {
      const title = esc(b.title);
      const author = esc(b.author);
      const year = b.year ? `· ${esc(b.year)}` : "";
      const rating =
        (b.rating ?? null) !== null ? `★ ${esc(b.rating)}` : "★ —";
      const tags = Array.isArray(b.tags)
        ? b.tags
            .slice(0, 4)
            .map((t) => `<span class="pill">${esc(t)}</span>`)
            .join("")
        : "";

      return `
      <article class="book" data-id="${esc(b._id)}">
        <div class="cover"></div>
        <div class="book-body">
          <div class="book-top">
            <h3 class="book-title">${title}</h3>
            <div class="book-meta">${rating} <span class="muted"> ${year}</span></div>
          </div>
          <div class="book-author">${author}</div>
          <div class="book-tags">${tags}</div>
          <div class="book-actions">
            <button class="btn btn--tiny" data-action="details">Details</button>
            <button class="btn btn--tiny" data-action="favorite">❤️</button>
            <button class="btn btn--tiny btn--danger" data-action="delete">Delete</button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  grid.querySelectorAll(".book").forEach((card) => {
    card.addEventListener("click", async (e) => {
      const action = e.target?.dataset?.action;
      if (!action) return;

      const id = card.dataset.id;
      if (action === "details") return showDetails(id);
      if (action === "delete") return deleteBook(id);
      if (action === "favorite") return addToFavorites(id, e.target);
    });
  });
}

async function showDetails(id) {
  const res = await fetch(`/api/books/${id}`);
  const b = await res.json();
  if (!res.ok)
    return openModal(`<h2>Error</h2><p>${esc(b.error || "Failed")}</p>`);

  const tags = Array.isArray(b.tags)
    ? b.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join("")
    : "";

  openModal(`
    <h2>${esc(b.title)}</h2>
    <p class="muted-text">by ${esc(b.author)} ${b.year ? `· ${esc(b.year)}` : ""}</p>
    <div class="book-tags">${tags}</div>
    <p>${esc(b.description || "No description.")}</p>
  `);
}

async function deleteBook(id) {
  if (!confirm("Delete this book?")) return;
  const res = await fetch(`/api/books/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (res.status === 401) return requireLogin();
  if (!res.ok) return alert("Delete failed");

  await loadBooks();
}

async function addToFavorites(bookId, btn) {
  const res = await fetch(`/api/favorites/${bookId}`, {
    method: "POST",
    credentials: "include",
  });

  if (res.status === 401) return requireLogin();
  if (!res.ok) return alert("Failed to add to favorites");

  btn.textContent = "💛";
  btn.disabled = true;
}

reloadBtn.addEventListener("click", loadBooks);
q.addEventListener("input", loadBooks);
tag.addEventListener("change", loadBooks);
sort.addEventListener("change", loadBooks);

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  const fd = new FormData(createForm);
  const payload = Object.fromEntries(fd.entries());
  payload.year = payload.year ? Number(payload.year) : null;
  payload.rating = payload.rating ? Number(payload.rating) : null;
  payload.tags = payload.tags
    ? payload.tags.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const res = await fetch("/api/books", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) return requireLogin();
  if (!res.ok) return alert("Create failed");

  createForm.reset();
  await loadBooks();
});

loadBooks();
