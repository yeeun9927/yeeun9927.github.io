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

  const detailCards = projectCards.filter((card) => card.hasAttribute("data-opens-detail"));
  const detailNext = page.querySelector("[data-detail-next]");
  let currentDetailCard = null;

  function openDetail(card) {
    currentDetailCard = card;
    updateProjectPreview(card);
    updateDetailContent(card);
    indexView.classList.remove("is-active");
    detailView.hidden = false;
    window.scrollTo(0, 0);
    detailView.querySelector(".detail-gallery")?.scrollTo?.(0, 0);
    startCarousel();
  }

  projectCards.forEach((card) => {
    card.addEventListener("pointerenter", () => updateProjectPreview(card));
    card.addEventListener("focus", () => updateProjectPreview(card));
    card.addEventListener("click", () => {
      if (card.hasAttribute("data-opens-detail")) {
        openDetail(card);
      } else {
        updateProjectPreview(card);
      }
    });
  });

  // NEXT →: 상세페이지가 있는 다음 프로젝트로 (마지막이면 처음으로)
  if (detailNext) {
    detailNext.hidden = detailCards.length < 2;
    detailNext.addEventListener("click", () => {
      const index = detailCards.indexOf(currentDetailCard);
      openDetail(detailCards[(index + 1) % detailCards.length]);
    });
  }

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
    : `${requestedPage.replace("-", " ").toUpperCase()} | 9GU9G9G9G`;

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

  if (page?.hasAttribute("data-p3d-page")) {
    const p3dDetail = page.querySelector("[data-p3d-detail]:not([hidden])");
    return p3dDetail ? p3dDetail.querySelector("[data-p3d-main]") : null;
  }

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
      width = `${Math.min(rect.width * 0.28, Math.max(60, Math.min(window.innerWidth * 0.088, 144)))}px`;
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

  // 사진과 겹치면 투명도 없이 완전 반전, 그 외에는 반투명
  watermark.classList.toggle("is-over-photo", onArtwork || isWatermarkOverPhoto());
}

function isWatermarkOverPhoto() {
  const page = document.querySelector(".site-page.is-active");

  if (!page) {
    return false;
  }

  const mark = watermark.getBoundingClientRect();

  return Array.from(page.querySelectorAll("img")).some((image) => {
    if (image.hidden || !image.complete || image.naturalWidth === 0) {
      return false;
    }

    const rect = image.getBoundingClientRect();

    return (
      rect.width > 0 &&
      rect.left < mark.right &&
      rect.right > mark.left &&
      rect.top < mark.bottom &&
      rect.bottom > mark.top
    );
  });
}

function scheduleWatermarkUpdate() {
  if (!watermarkFrame) {
    watermarkFrame = requestAnimationFrame(updateWatermark);
  }
}

if (watermark) {
  window.addEventListener("resize", scheduleWatermarkUpdate);
  document.addEventListener("load", scheduleWatermarkUpdate, true);
  document.addEventListener("scroll", scheduleWatermarkUpdate, { capture: true, passive: true });
  new MutationObserver(scheduleWatermarkUpdate).observe(document.querySelector(".site-pages"), {
    attributes: true,
    attributeFilter: ["class", "hidden"],
    subtree: true,
  });
  updateWatermark();
}

// HOME 전체 프로젝트 더미: 상세페이지가 있는 모든 프로젝트의 이미지를 섞어서 촘촘히 배치
const homePile = document.querySelector("[data-home-pile]");

function toThumbPath(path) {
  if (path.includes("/thumb/")) {
    return path;
  }

  if (path.includes("/web/")) {
    return path.replace("/web/", "/thumb/");
  }

  const slash = path.lastIndexOf("/");
  const dir = path.slice(0, slash);
  const name = path.slice(slash + 1).replace(/\.[^.]+$/, "");
  return `${dir}/thumb/${name}.jpg`;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}

function buildHomePile() {
  if (!homePile) {
    return;
  }

  const tiles = [];

  portfolioPages.forEach((page) => {
    page.querySelectorAll("[data-project-card][data-opens-detail]").forEach((card) => {
      const paths = new Set();
      const cardImage = card.querySelector("img");

      if (cardImage) {
        paths.add(toThumbPath(cardImage.getAttribute("src")));
      }

      const detailImages = card.dataset.detailImages
        ? card.dataset.detailImages.split("|")
        : Array.from(page.querySelectorAll("[data-detail-view] .detail-gallery img"))
          .map((image) => image.getAttribute("src"));

      detailImages
        .map((path) => path.trim())
        .filter(Boolean)
        .forEach((path) => paths.add(toThumbPath(path)));

      paths.forEach((path) => {
        tiles.push({ path, card, pageName: page.dataset.page });
      });
    });
  });

  // 3D PROJECT는 프로젝트마다 대표(메인) 사진 한 장만: 목록 카드에 쓰인 사진
  document.querySelectorAll("[data-p3d-card]").forEach((card) => {
    const pageName = card.closest("[data-page]")?.dataset.page;
    const cover = card.querySelector("img")?.getAttribute("src");

    if (cover) {
      tiles.push({ path: toThumbPath(cover), card, pageName });
    }
  });

  const fragment = document.createDocumentFragment();

  shuffle(tiles).forEach(({ path, card, pageName }) => {
    const title = card.dataset.previewTitle || card.dataset.title || card.textContent.trim();
    const button = document.createElement("button");
    const image = document.createElement("img");
    const label = document.createElement("span");

    button.type = "button";
    button.className = "home-pile-item";
    button.setAttribute("aria-label", `${title} 상세 보기`);
    image.src = path;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    image.addEventListener("error", () => button.remove(), { once: true });
    label.className = "home-pile-label";
    label.textContent = title;

    button.addEventListener("click", () => {
      showPage(pageName);
      card.click();
    });

    button.append(image, label);
    fragment.append(button);
  });

  homePile.append(fragment);
}

buildHomePile();

// 3D PROJECT: 목록 → 상세(큰 이미지 슬라이드 + 하단 썸네일). 자동 넘김 간격은 PLASTER 상세와 같은 6초
const p3dPage = document.querySelector("[data-p3d-page]");

if (p3dPage) {
  const p3dDelay = 6000;
  const p3dCards = Array.from(p3dPage.querySelectorAll("[data-p3d-card]"));
  const p3dIndex = p3dPage.querySelector("[data-p3d-index]");
  const p3dDetail = p3dPage.querySelector("[data-p3d-detail]");
  const p3dMain = p3dPage.querySelector("[data-p3d-main]");
  const p3dStrip = p3dPage.querySelector("[data-p3d-strip]");
  const p3dTitle = p3dPage.querySelector("[data-p3d-title]");
  const p3dMeta = p3dPage.querySelector("[data-p3d-meta]");
  const p3dCount = p3dPage.querySelector("[data-p3d-count]");
  const p3dNextProject = p3dPage.querySelector("[data-p3d-next-project]");
  let p3dImages = [];
  let p3dCurrent = 0;
  let p3dTimer = null;
  let p3dCard = null;

  const pad = (number) => String(number).padStart(2, "0");

  function p3dShow(index) {
    if (!p3dImages.length) {
      return;
    }

    p3dCurrent = (index + p3dImages.length) % p3dImages.length;
    const path = p3dImages[p3dCurrent];

    if (p3dMain.getAttribute("src") !== path) {
      p3dMain.classList.remove("is-shown");
      p3dMain.src = path;
    }

    if (p3dMain.complete && p3dMain.naturalWidth > 0) {
      p3dMain.classList.add("is-shown");
    }

    p3dMain.alt = `${p3dCard?.dataset.title || "Project"} ${p3dCurrent + 1}`;
    p3dCount.textContent = `${pad(p3dCurrent + 1)} / ${pad(p3dImages.length)}`;

    Array.from(p3dStrip.children).forEach((thumb, thumbIndex) => {
      const isActive = thumbIndex === p3dCurrent;
      thumb.classList.toggle("is-active", isActive);

      if (isActive) {
        p3dStrip.scrollTo({
          left: thumb.offsetLeft - (p3dStrip.clientWidth - thumb.offsetWidth) / 2,
          behavior: "smooth",
        });
      }
    });

    // 다음 이미지를 미리 받아둠
    const nextImage = new Image();
    nextImage.src = p3dImages[(p3dCurrent + 1) % p3dImages.length];
  }

  p3dMain.addEventListener("load", () => p3dMain.classList.add("is-shown"));

  function p3dStop() {
    clearInterval(p3dTimer);
    p3dTimer = null;
  }

  function p3dRestart() {
    p3dStop();

    if (!p3dDetail.hidden && p3dImages.length > 1) {
      p3dTimer = setInterval(() => p3dShow(p3dCurrent + 1), p3dDelay);
    }
  }

  function p3dGo(step) {
    p3dShow(p3dCurrent + step);
    p3dRestart();
  }

  function p3dOpen(card) {
    p3dCard = card;
    p3dImages = (card.dataset.images || "")
      .split("|")
      .map((path) => path.trim())
      .filter(Boolean);
    p3dTitle.textContent = card.dataset.title || "";
    p3dMeta.textContent = card.dataset.meta || "";

    p3dStrip.replaceChildren(...p3dImages.map((path, index) => {
      const thumb = document.createElement("button");
      const image = document.createElement("img");

      thumb.type = "button";
      thumb.setAttribute("aria-label", `Image ${index + 1}`);
      image.src = toThumbPath(path);
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      thumb.append(image);
      thumb.addEventListener("click", () => {
        p3dShow(index);
        p3dRestart();
      });
      return thumb;
    }));

    p3dIndex.hidden = true;
    p3dDetail.hidden = false;
    window.scrollTo(0, 0);
    p3dMain.removeAttribute("src");
    p3dShow(0);
    p3dRestart();
  }

  function p3dClose() {
    p3dStop();
    p3dDetail.hidden = true;
    p3dIndex.hidden = false;
    window.scrollTo(0, 0);
  }

  p3dCards.forEach((card) => card.addEventListener("click", () => p3dOpen(card)));
  p3dPage.querySelector("[data-p3d-back]").addEventListener("click", p3dClose);
  p3dPage.querySelector("[data-p3d-prev]").addEventListener("click", () => p3dGo(-1));
  p3dPage.querySelector("[data-p3d-next]").addEventListener("click", () => p3dGo(1));

  p3dNextProject.hidden = p3dCards.length < 2;
  p3dNextProject.addEventListener("click", () => {
    const index = p3dCards.indexOf(p3dCard);
    p3dOpen(p3dCards[(index + 1) % p3dCards.length]);
  });

  document.addEventListener("keydown", (event) => {
    if (p3dDetail.hidden || !p3dPage.classList.contains("is-active")) {
      return;
    }

    if (event.key === "ArrowLeft") {
      p3dGo(-1);
    } else if (event.key === "ArrowRight") {
      p3dGo(1);
    } else if (event.key === "Escape") {
      p3dClose();
    }
  });

  // 다른 페이지로 가거나 메뉴에서 3D PROJECT를 다시 누르면 목록으로
  portfolioControllers.set(p3dPage.dataset.page, { closeDetail: p3dClose });
}
