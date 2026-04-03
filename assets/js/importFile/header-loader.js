// header-loader.js
document.addEventListener("DOMContentLoaded", function () {
  // 1. 取得頁面中準備放置 header 的容器
  const headerContainer = document.querySelector("#header-placeholder");

  if (headerContainer) {
    // 2. 使用 fetch 讀取 rci-header-front.html
    fetch("rci-header-front.html")
      .then((response) => response.text())
      .then((data) => {
        headerContainer.innerHTML = data;
        highlightCurrentPage();
      });
  }
});

/*
function highlightCurrentPage() {
    // 3. 自動判斷當前頁面並加上 active class
    const path = window.location.pathname;
    const page = path.split("/").pop();

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const link = item.querySelector('a').getAttribute('href');
        if (page === link || (page === '' && link === 'index.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
    */
function highlightCurrentPage() {
  const path = window.location.pathname;
  const page = path.split("/").pop();

  const headerContainer = document.querySelector("#header-placeholder");
  if (!headerContainer) return;

  const navItems = headerContainer.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    const aTag = item.querySelector("a");

    if (aTag) {
      const link = aTag.getAttribute("href");
      if (link && (page === link || (page === "" && link === "index.html"))) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    }
  });
}
