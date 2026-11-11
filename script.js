const pages = Array.from(document.querySelectorAll("[data-page]"));
const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));
const previewImage = document.querySelector(".preview-image");
const previewPlaceholder = document.querySelector(".preview-placeholder");
const previewTitle = document.querySelector(".preview-title");
const previewMeta = document.querySelector(".preview-meta");
const interiorIndex = document.querySelector('[data-interior-view="index"]');
const interiorDetail = document.querySelector('[data-interior-view="detail"]');
const detailBack = document.querySelector("[data-detail-back]");

function closeProjectDetail() {
  interiorDetail.hidden = true;
  interiorIndex.classList.add("is-active");
  window.scrollTo(0, 0);
}

function showPage(pageName, updateHash = true) {
  const requestedPage = pages.some((page) => page.dataset.page === pageName)
    ? pageName
    : "home";

  pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === requestedPage);
  });

  pageLinks.forEach((link) => {
    const isActive = link.dataset.pageLink === requestedPage;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  if (requestedPage !== "interior") {
    closeProjectDetail();
  }

  document.title = requestedPage === "home"
    ? "9GU9G9G9G Portfolio"
    : `${requestedPage.toUpperCase()} | 9GU9G9G9G`;

  window.scrollTo(0, 0);

  if (updateHash && window.location.hash !== `#${requestedPage}`) {
    window.history.pushState(null, "", `#${requestedPage}`);
  }
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (link.dataset.pageLink === "interior") {
      closeProjectDetail();
    }

    showPage(link.dataset.pageLink);
  });
});

window.addEventListener("popstate", () => {
  showPage(window.location.hash.slice(1) || "home", false);
});

function updateProjectPreview(card) {
  const imagePath = card.dataset.previewImage;

  projectCards.forEach((item) => {
    item.classList.toggle("is-selected", item === card);
  });

  previewTitle.textContent = card.dataset.previewTitle;
  previewMeta.textContent = card.dataset.previewMeta;

  if (imagePath) {
    previewImage.src = imagePath;
    previewImage.hidden = false;
    previewPlaceholder.hidden = true;
  } else {
    previewImage.hidden = true;
    previewPlaceholder.hidden = false;
  }
}

projectCards.forEach((card) => {
  card.addEventListener("pointerenter", () => updateProjectPreview(card));
  card.addEventListener("focus", () => updateProjectPreview(card));
  card.addEventListener("click", () => {
    updateProjectPreview(card);

    if (card.dataset.projectCard === "project-01") {
      interiorIndex.classList.remove("is-active");
      interiorDetail.hidden = false;
      window.scrollTo(0, 0);
    }
  });
});

detailBack.addEventListener("click", closeProjectDetail);

const gridCanvas = document.querySelector(".cursor-grid");
const gridContext = gridCanvas.getContext("2d");
const trail = [];
const cellSize = 4;
const maxTrail = 960;
const trailDuration = 4200;
let activeCell = null;
let animationFrame = null;

function resizeGridCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;

  gridCanvas.width = Math.ceil(window.innerWidth * pixelRatio);
  gridCanvas.height = Math.ceil(window.innerHeight * pixelRatio);
  gridCanvas.style.width = `${window.innerWidth}px`;
  gridCanvas.style.height = `${window.innerHeight}px`;
  gridContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawGridTrail();
}

function addTrailCell(x, y) {
  const cell = {
    x: Math.floor(x / cellSize),
    y: Math.floor(y / cellSize),
    time: performance.now(),
  };
  const lastCell = trail[trail.length - 1];

  activeCell = cell;

  if (!lastCell || lastCell.x !== cell.x || lastCell.y !== cell.y) {
    trail.push(cell);
  }

  while (trail.length > maxTrail) {
    trail.shift();
  }

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(drawGridTrail);
  }
}

function drawGridTrail() {
  const now = performance.now();
  const width = window.innerWidth;
  const height = window.innerHeight;

  animationFrame = null;
  gridContext.clearRect(0, 0, width, height);
  gridContext.strokeStyle = "rgba(21, 21, 21, 0.07)";
  gridContext.lineWidth = 1;

  for (let x = 0; x <= width; x += cellSize) {
    gridContext.beginPath();
    gridContext.moveTo(x, 0);
    gridContext.lineTo(x, height);
    gridContext.stroke();
  }

  for (let y = 0; y <= height; y += cellSize) {
    gridContext.beginPath();
    gridContext.moveTo(0, y);
    gridContext.lineTo(width, y);
    gridContext.stroke();
  }

  trail.forEach((cell, index) => {
    const age = now - cell.time;
    const fade = Math.max(0, 1 - age / trailDuration);
    const sequence = (index + 1) / trail.length;
    const alpha = Math.min(0.58, fade * (0.1 + sequence * 0.46));

    gridContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    gridContext.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
  });

  if (activeCell) {
    gridContext.fillStyle = "rgba(10, 10, 10, 0.72)";
    gridContext.fillRect(
      activeCell.x * cellSize,
      activeCell.y * cellSize,
      cellSize,
      cellSize,
    );
  }

  for (let index = trail.length - 1; index >= 0; index -= 1) {
    if (now - trail[index].time > trailDuration) {
      trail.splice(index, 1);
    }
  }

  if (trail.length) {
    animationFrame = requestAnimationFrame(drawGridTrail);
  }
}

window.addEventListener("pointermove", (event) => {
  addTrailCell(event.clientX, event.clientY);
});

window.addEventListener("pointerleave", () => {
  activeCell = null;
  drawGridTrail();
});

window.addEventListener("resize", resizeGridCanvas);
showPage(window.location.hash.slice(1) || "home", false);
resizeGridCanvas();
