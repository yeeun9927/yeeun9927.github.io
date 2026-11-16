const pages = Array.from(document.querySelectorAll("[data-page]"));
const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const portfolioPages = Array.from(document.querySelectorAll("[data-portfolio-page]"));
const portfolioControllers = new Map();

function setupOptionalImage(image) {
  const container = image.parentElement;

  function markMissing() {
    image.hidden = true;
    container.classList.add("is-missing");
  }

  function markLoaded() {
    image.hidden = false;
    container.classList.remove("is-missing");
  }

  image.addEventListener("error", markMissing);
  image.addEventListener("load", markLoaded);

  if (image.complete) {
    if (image.naturalWidth > 0) {
      markLoaded();
    } else {
      markMissing();
    }
  }
}

document.querySelectorAll("[data-optional-image]").forEach(setupOptionalImage);

portfolioPages.forEach((page) => {
  const projectCards = Array.from(page.querySelectorAll("[data-project-card]"));
  const previewImage = page.querySelector(".preview-image");
  const previewPlaceholder = page.querySelector(".preview-placeholder");
  const previewTitle = page.querySelector(".preview-title");
  const previewMeta = page.querySelector(".preview-meta");
  const indexView = page.querySelector("[data-index-view]");
  const detailView = page.querySelector("[data-detail-view]");
  const detailBack = page.querySelector("[data-detail-back]");
  const detailNumber = page.querySelector("[data-detail-number]");
  const detailTitle = page.querySelector("[data-detail-title]");
  const detailDescription = page.querySelector("[data-detail-description]");
  const carousel = page.querySelector("[data-auto-carousel]");
  const carouselTrack = carousel?.querySelector(".carousel-track");
  let carouselSlides = carousel
    ? Array.from(carousel.querySelectorAll(".carousel-slide"))
    : [];
  const carouselIndex = carousel?.querySelector("[data-carousel-index]");
  const carouselTotal = carousel?.querySelector("[data-carousel-total]");
  const carouselPrev = carousel?.querySelector("[data-carousel-prev]");
  const carouselNext = carousel?.querySelector("[data-carousel-next]");
  const zoomLens = carousel?.querySelector("[data-zoom-lens]");
  const carouselDelay = 6000;
  const carouselTransitionDuration = 1000;
  let carouselPosition = carouselSlides.length > 1 ? 1 : 0;
  let carouselTimer = null;
  let carouselResetTimer = null;
  let carouselLocked = false;
  let previewRequestId = 0;

  function addCarouselClones() {
    if (!carouselTrack || carouselSlides.length < 2) {
      return;
    }

    const firstSlideClone = carouselSlides[0].cloneNode(true);
    const lastSlideClone = carouselSlides.at(-1).cloneNode(true);
    firstSlideClone.setAttribute("aria-hidden", "true");
    lastSlideClone.setAttribute("aria-hidden", "true");
    firstSlideClone.dataset.carouselClone = "";
    lastSlideClone.dataset.carouselClone = "";
    carouselTrack.prepend(lastSlideClone);
    carouselTrack.append(firstSlideClone);
  }

  addCarouselClones();

  function renderCarousel() {
    if (!carouselTrack) {
      return;
    }

    carouselTrack.style.transform = `translateX(-${carouselPosition * 100}%)`;

    if (carouselIndex) {
      const visibleIndex = (
        (carouselPosition - 1 + carouselSlides.length) % carouselSlides.length
      );
      carouselIndex.textContent = String(visibleIndex + 1).padStart(2, "0");
    }
  }

  renderCarousel();

  function updateDetailContent(card) {
    if (detailNumber && card.dataset.detailNumber) {
      detailNumber.textContent = card.dataset.detailNumber;
    }

    if (detailTitle && card.dataset.detailTitle) {
      detailTitle.textContent = card.dataset.detailTitle;
    }

    if (detailDescription && card.dataset.detailDescription) {
      detailDescription.textContent = card.dataset.detailDescription;
    }

    const imagePaths = card.dataset.detailImages
      ?.split("|")
      .map((path) => path.trim())
      .filter(Boolean);

    if (!carouselTrack || !imagePaths?.length) {
      return;
    }

    stopCarousel(false);
    zoomLens?.classList.remove("is-visible");
    carouselTrack.replaceChildren();

    carouselSlides = imagePaths.map((imagePath, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");

      figure.className = "carousel-slide";
      image.src = imagePath;
      image.alt = `${card.dataset.detailTitle || "Project"} detail ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      figure.append(image);
      carouselTrack.append(figure);
      return figure;
    });

    if (carouselTotal) {
      carouselTotal.textContent = String(carouselSlides.length).padStart(2, "0");
    }

    carousel?.classList.toggle("is-single-slide", carouselSlides.length < 2);

    addCarouselClones();
    carouselPosition = carouselSlides.length > 1 ? 1 : 0;
    carouselTrack.classList.add("is-resetting");
    renderCarousel();
    carouselTrack.offsetWidth;
    carouselTrack.classList.remove("is-resetting");
  }

  function resetCarouselBoundary() {
    if (!carouselTrack) {
      return;
    }

    if (carouselPosition === 0) {
      carouselPosition = carouselSlides.length;
    } else if (carouselPosition === carouselSlides.length + 1) {
      carouselPosition = 1;
    } else {
      return;
    }

    carouselTrack.classList.add("is-resetting");
    renderCarousel();
    carouselTrack.offsetWidth;
    carouselTrack.classList.remove("is-resetting");
  }

  function moveCarousel(direction) {
    if (!carouselTrack || carouselLocked || carouselSlides.length < 2) {
      return;
    }

    carouselLocked = true;
    zoomLens?.classList.remove("is-visible");
    window.clearTimeout(carouselResetTimer);
    carouselPosition += direction;
    renderCarousel();

    carouselResetTimer = window.setTimeout(() => {
      resetCarouselBoundary();
      carouselLocked = false;
      carouselResetTimer = null;
    }, carouselTransitionDuration + 20);
  }

  function stopCarousel(reset = false) {
    window.clearInterval(carouselTimer);
    window.clearTimeout(carouselResetTimer);
    carouselTimer = null;
    carouselResetTimer = null;
    carouselLocked = false;

    if (reset) {
      carouselPosition = carouselSlides.length > 1 ? 1 : 0;
      carouselTrack?.classList.add("is-resetting");
      renderCarousel();
      carouselTrack?.offsetWidth;
      carouselTrack?.classList.remove("is-resetting");
    }
  }

  function pauseCarousel() {
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }

  function startCarousel(reset = true) {
    if (carouselSlides.length < 2) {
      return;
    }

    if (reset) {
      stopCarousel(true);
    } else {
      pauseCarousel();
    }

    carouselTimer = window.setInterval(() => {
      moveCarousel(1);
    }, carouselDelay);
  }

  if (carousel) {
    carousel.addEventListener("pointerenter", () => {
      pauseCarousel();
    });

    carousel.addEventListener("pointermove", (event) => {
      if (!zoomLens || carouselLocked || carouselSlides.length === 0) {
        zoomLens?.classList.remove("is-visible");
        return;
      }

      const visibleIndex = (
        (carouselPosition - 1 + carouselSlides.length) % carouselSlides.length
      );
      const activeImage = carouselSlides[visibleIndex].querySelector("img");
      const imageBounds = activeImage.getBoundingClientRect();

      const isOverImage = event.clientX >= imageBounds.left
        && event.clientX <= imageBounds.right
        && event.clientY >= imageBounds.top
        && event.clientY <= imageBounds.bottom;

      if (!isOverImage) {
        zoomLens.classList.remove("is-visible");
        return;
      }

      const carouselBounds = carousel.getBoundingClientRect();
      const lensSize = zoomLens.offsetWidth;
      const cursorX = event.clientX - carouselBounds.left;
      const cursorY = event.clientY - carouselBounds.top;
      const lensLeft = Math.min(
        Math.max(0, cursorX - lensSize / 2),
        carouselBounds.width - lensSize,
      );
      const lensTop = Math.min(
        Math.max(0, cursorY - lensSize / 2),
        carouselBounds.height - lensSize,
      );
      const sourceX = event.clientX - imageBounds.left;
      const sourceY = event.clientY - imageBounds.top;
      const pointerInLensX = cursorX - lensLeft;
      const pointerInLensY = cursorY - lensTop;
      const zoom = 3;

      zoomLens.style.left = `${lensLeft}px`;
      zoomLens.style.top = `${lensTop}px`;
      zoomLens.style.backgroundImage = `url("${activeImage.currentSrc || activeImage.src}")`;
      zoomLens.style.backgroundSize = `${imageBounds.width * zoom}px ${imageBounds.height * zoom}px`;
      zoomLens.style.backgroundPosition = `${pointerInLensX - sourceX * zoom}px ${pointerInLensY - sourceY * zoom}px`;
      zoomLens.classList.add("is-visible");
    });

    carousel.addEventListener("pointerleave", () => {
      zoomLens?.classList.remove("is-visible");

      if (!detailView.hidden) {
        startCarousel(false);
      }
    });

    carouselPrev?.addEventListener("click", () => {
      pauseCarousel();
      moveCarousel(-1);
    });

    carouselNext?.addEventListener("click", () => {
      pauseCarousel();
      moveCarousel(1);
    });
  }

  function closeDetail() {
    stopCarousel(true);
    detailView.hidden = true;
    indexView.classList.add("is-active");
    window.scrollTo(0, 0);
  }

  function showPreviewPlaceholder() {
    previewImage.hidden = true;
    previewPlaceholder.hidden = false;
  }

  function showPreviewImage() {
    previewImage.hidden = false;
    previewPlaceholder.hidden = true;
  }

  async function loadPreviewImage(imagePath) {
    const requestId = ++previewRequestId;

    showPreviewPlaceholder();

    if (previewImage.getAttribute("src") !== imagePath) {
      previewImage.src = imagePath;
    }

    try {
      if (typeof previewImage.decode === "function") {
        await previewImage.decode();
      } else if (!previewImage.complete) {
        await new Promise((resolve, reject) => {
          previewImage.addEventListener("load", resolve, { once: true });
          previewImage.addEventListener("error", reject, { once: true });
        });
      }
    } catch {
      if (requestId === previewRequestId) {
        showPreviewPlaceholder();
      }
      return;
    }

    if (requestId === previewRequestId && previewImage.naturalWidth > 0) {
      showPreviewImage();
    }
  }

  loadPreviewImage(previewImage.getAttribute("src"));

  function updateProjectPreview(card) {
    const imagePath = card.dataset.previewImage;

    projectCards.forEach((item) => {
      item.classList.toggle("is-selected", item === card);
    });

    previewTitle.textContent = card.dataset.previewTitle;
    previewMeta.textContent = card.dataset.previewMeta;

    if (imagePath) {
      loadPreviewImage(imagePath);
    } else {
      previewRequestId += 1;
      showPreviewPlaceholder();
    }
  }

  projectCards.forEach((card) => {
    card.addEventListener("pointerenter", () => updateProjectPreview(card));
    card.addEventListener("focus", () => updateProjectPreview(card));
    card.addEventListener("click", () => {
      updateProjectPreview(card);

      if (card.hasAttribute("data-opens-detail")) {
        updateDetailContent(card);
        indexView.classList.remove("is-active");
        detailView.hidden = false;
        window.scrollTo(0, 0);
        startCarousel();
      }
    });
  });

  detailBack.addEventListener("click", closeDetail);
  portfolioControllers.set(page.dataset.page, { closeDetail });
});

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

  portfolioControllers.forEach((controller, pageName) => {
    if (pageName !== requestedPage) {
      controller.closeDetail();
    }
  });

  document.title = requestedPage === "home"
    ? "9GU9G9G9G Portfolio"
    : `${requestedPage.toUpperCase()} | 9GU9G9G9G`;

  window.scrollTo(0, 0);

  if (requestedPage === "about") {
    document.querySelector(".about-page")?.scrollTo(0, 0);
  }

  if (updateHash && window.location.hash !== `#${requestedPage}`) {
    window.history.pushState(null, "", `#${requestedPage}`);
  }
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    portfolioControllers.get(link.dataset.pageLink)?.closeDetail();

    showPage(link.dataset.pageLink);
  });
});

window.addEventListener("popstate", () => {
  showPage(window.location.hash.slice(1) || "home", false);
});

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
  gridContext.strokeStyle = "rgba(21, 21, 21, 0.035)";
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
    const alpha = Math.min(0.29, fade * (0.05 + sequence * 0.23));

    gridContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    gridContext.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
  });

  if (activeCell) {
    gridContext.fillStyle = "rgba(10, 10, 10, 0.36)";
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

// 도용방지 워터마크: 작업물이 보이면 작업물 중앙, 아니면 화면 중앙 (겹치는 글자·사진은 색 반전)
const watermark = document.querySelector(".site-watermark");
const headerHeight = 36;
let watermarkFrame = null;

function getWatermarkTarget() {
  const page = document.querySelector(".site-page.is-active");

  if (!page || !page.hasAttribute("data-portfolio-page")) {
    return null;
  }

  const detail = page.querySelector("[data-detail-view]:not([hidden])");

  if (detail) {
    return detail.querySelector(".detail-gallery");
  }

  return page.querySelector("[data-index-view].is-active .preview-frame");
}

function updateWatermark() {
  watermarkFrame = null;

  const target = getWatermarkTarget();
  const viewTop = headerHeight;
  const viewBottom = window.innerHeight;
  let x = window.innerWidth / 2;
  let y = viewTop + (viewBottom - viewTop) / 2;
  let width = "";
  let onArtwork = false;

  if (target) {
    const rect = target.getBoundingClientRect();
    const top = Math.max(rect.top, viewTop);
    const bottom = Math.min(rect.bottom, viewBottom);

    if (rect.width > 0 && bottom > top) {
      onArtwork = true;
      x = rect.left + rect.width / 2;
      y = top + (bottom - top) / 2;
      width = `${Math.min(rect.width * 0.35, Math.max(75, Math.min(window.innerWidth * 0.11, 180)))}px`;
    }
  }

  watermark.classList.toggle("is-on-artwork", onArtwork);
  watermark.style.setProperty("--wm-x", `${x}px`);
  watermark.style.setProperty("--wm-y", `${y}px`);

  if (width) {
    watermark.style.setProperty("--wm-width", width);
  } else {
    watermark.style.removeProperty("--wm-width");
  }
}

function scheduleWatermarkUpdate() {
  if (!watermarkFrame) {
    watermarkFrame = requestAnimationFrame(updateWatermark);
  }
}

if (watermark) {
  window.addEventListener("resize", scheduleWatermarkUpdate);
  document.addEventListener("scroll", scheduleWatermarkUpdate, { capture: true, passive: true });
  new MutationObserver(scheduleWatermarkUpdate).observe(document.querySelector(".site-pages"), {
    attributes: true,
    attributeFilter: ["class", "hidden"],
    subtree: true,
  });
  updateWatermark();
}
