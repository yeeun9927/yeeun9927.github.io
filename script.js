const slides = Array.from(document.querySelectorAll(".slide"));
const prevButton = document.querySelector(".prev");
const nextButton = document.querySelector(".next");
const currentIndex = document.querySelector(".current-index");
const slider = document.querySelector(".slider");
const imageCaption = document.querySelector(".image-caption");
const captionTitle = document.querySelector(".caption-title");
const captionText = document.querySelector(".caption-text");
const slideDescriptions = [
  "Interior study with soft light, layered material texture, and a calm circulation path for everyday movement.",
  "Compact residence plan focused on clean storage, quiet thresholds, and furniture placement that keeps the room open.",
  "Living area proposal using neutral tones, low visual weight, and warm surfaces to create a relaxed domestic rhythm.",
  "Material direction study for a bright residential renewal, balancing reflective finishes with grounded natural textures.",
  "Quiet bedroom scene with soft surfaces, reduced furniture lines, and lighting planned for rest and late evening use.",
  "Curated living space balancing object display, hidden storage, and comfortable proportions for daily gathering.",
];

let activeIndex = 0;
let slideTimer = null;
let captionTarget = { x: 0, y: 0 };
let captionPosition = { x: 0, y: 0 };
let captionFrame = null;

function updateCaption() {
  captionTitle.textContent = `Project ${String(activeIndex + 1).padStart(2, "0")}`;
  captionText.textContent = slideDescriptions[activeIndex];
}

function showSlide(index, direction = "forward") {
  const previousIndex = activeIndex;

  activeIndex = (index + slides.length) % slides.length;

  if (previousIndex === activeIndex) {
    return;
  }

  window.clearTimeout(slideTimer);
  slider.classList.toggle("is-forward", direction === "forward");
  slider.classList.toggle("is-backward", direction === "backward");

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeIndex);
    slide.classList.toggle("is-exiting", slideIndex === previousIndex);
  });

  currentIndex.textContent = String(activeIndex + 1).padStart(2, "0");
  updateCaption();

  slideTimer = window.setTimeout(() => {
    slides[previousIndex].classList.remove("is-exiting");
  }, 780);
}

prevButton.addEventListener("click", () => {
  showSlide(activeIndex - 1, "backward");
});

nextButton.addEventListener("click", () => {
  showSlide(activeIndex + 1, "forward");
});

slider.addEventListener("pointermove", (event) => {
  const sliderRect = slider.getBoundingClientRect();

  captionTarget = {
    x: event.clientX - sliderRect.left,
    y: event.clientY - sliderRect.top,
  };

  if (!captionFrame) {
    captionPosition = { ...captionTarget };
    captionFrame = requestAnimationFrame(moveCaption);
  }
});

slider.addEventListener("pointerleave", () => {
  window.cancelAnimationFrame(captionFrame);
  captionFrame = null;
});

function moveCaption() {
  captionPosition.x += (captionTarget.x - captionPosition.x) * 0.14;
  captionPosition.y += (captionTarget.y - captionPosition.y) * 0.14;

  imageCaption.style.setProperty("--caption-x", `${captionPosition.x}px`);
  imageCaption.style.setProperty("--caption-y", `${captionPosition.y}px`);

  captionFrame = requestAnimationFrame(moveCaption);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    showSlide(activeIndex - 1, "backward");
  }

  if (event.key === "ArrowRight") {
    showSlide(activeIndex + 1, "forward");
  }
});

const gridCanvas = document.querySelector(".cursor-grid");
const gridContext = gridCanvas.getContext("2d");
const trail = [];
const cellSize = 4;
const maxTrail = 960;
const trailDuration = 4200;
let activeCell = null;
let pointerPosition = null;
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
  const now = performance.now();
  const cell = {
    x: Math.floor(x / cellSize),
    y: Math.floor(y / cellSize),
    time: now,
  };
  const lastCell = trail[trail.length - 1];

  activeCell = cell;
  pointerPosition = { x, y };

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
    gridContext.fillRect(
      cell.x * cellSize,
      cell.y * cellSize,
      cellSize,
      cellSize,
    );
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
  pointerPosition = null;
  drawGridTrail();
});

window.addEventListener("resize", resizeGridCanvas);
updateCaption();
resizeGridCanvas();
