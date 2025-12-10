document.addEventListener("DOMContentLoaded", function () {
  // Navigation Menu Toggle
  const toggleMenu = document.getElementById("toggleMenu");
  const navMenu = document.querySelector(".site-nav");
  const toggleDesc = document.getElementById("toggleDesc");
  const siteDesc = document.getElementById("siteDesc");
  const closeMenu = document.getElementById("closeMenu");

  if (toggleMenu && navMenu) {
    toggleMenu.addEventListener("click", function () {
      navMenu.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });
  }

  if (closeMenu && navMenu) {
  closeMenu.addEventListener("click", function () {
    navMenu.classList.remove("active");
    closeMenu.classList.remove("active");
    document.body.classList.remove("menu-open");
  });
}

  if (toggleDesc && siteDesc) {
    toggleDesc.addEventListener("click", function () {
      siteDesc.classList.toggle("active");
      toggleDesc.textContent = siteDesc.classList.contains("active")
        ? "Hide Description"
        : "Show Description";
    });
  }

  // FAQ Accordion Toggle
  const faqItems = document.querySelectorAll(".faq-item h3");
  faqItems.forEach((item) => {
    item.addEventListener("click", () => {
      const parent = item.parentElement;
      parent.classList.toggle("active");
    });
  });

  // Keep product-more open on desktop, collapsed on mobile (no display: none)
  const productMoreBlocks = document.querySelectorAll("details.product-more");
  if (productMoreBlocks.length) {
    const desktopQuery = window.matchMedia("(min-width: 900px)");
    const syncProductMore = () => {
      const isDesktop = desktopQuery.matches;
      productMoreBlocks.forEach((detailsEl) => {
        if (isDesktop) {
          detailsEl.setAttribute("open", "");
        } else {
          detailsEl.removeAttribute("open");
        }
      });
    };
    desktopQuery.addEventListener
      ? desktopQuery.addEventListener("change", syncProductMore)
      : desktopQuery.addListener(syncProductMore);
    syncProductMore();
  }
});

  
