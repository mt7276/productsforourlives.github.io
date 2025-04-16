document.addEventListener("DOMContentLoaded", function () {
  // Navigation Menu Toggle
  const toggleMenu = document.getElementById("toggleMenu");
  const navMenu = document.querySelector(".site-nav");
  const toggleDesc = document.getElementById("toggleDesc");
  const siteDesc = document.getElementById("siteDesc");

  if (toggleMenu && navMenu) {
    toggleMenu.addEventListener("click", function () {
      navMenu.classList.toggle("active");
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
});

