const getRealPath = (pathname, desc = false) => {
  if (!pathname) {
    pathname = window.location.pathname;
  }
  // 站点部署在子路径(如 /cn/)时, 剥掉站点根前缀再比较, 否则首段都是子路径名会导致所有菜单同时高亮
  const siteRoot = window.SITE_ROOT || "";
  if (siteRoot && pathname.indexOf(siteRoot) === 0) {
    pathname = pathname.slice(siteRoot.length - 1);
  } else if (siteRoot && pathname.indexOf(siteRoot.slice(0, -1)) === 0) {
    pathname = pathname.slice(siteRoot.length - 1) || "/";
  }
  let names = pathname.split("/");
  if (desc === false) {
    for (let i = names.length - 1; i >= 0; --i) {
      let name = names[i].trim();
      if (name.length > 0 && name !== "/" && name !== "index.html") {
        return name;
      }
    }
  } else {
    for (let i = 0; i < names.length; ++i) {
      let name = names[i].trim();
      if (name.length > 0 && name !== "/" && name !== "index.html") {
        return name;
      }
    }
  }
  return "/";
};
let links = document.querySelectorAll(".nexmoe-list-item");
let rootRealPath = getRealPath(window.location.pathname, true);
for (let link of links) {
  let linkPath = link.getAttribute("href");
  if (linkPath && getRealPath(linkPath, true) === rootRealPath) {
    link.className = "active nexmoe-list-item mdui-list-item mdui-ripple";
  }
}
$("table")
  .has("img")
  .addClass("nexmoe-album");

$("#nexmoe-content img").each(function() {
  $(this).attr("data-src", $(this).attr("src"));
  $(this).attr("src", "");
  $(this).addClass("lazyload");
  $(this).attr("referrerPolicy", "no-referrer");
});

$("article:not(.nexmoe-py) img").each(function() {
  var element = document.createElement("a");
  $(element).attr("data-fancybox", "gallery");
  $(element).attr("href", $(this).attr("data-src"));
  $(this).wrap(element);
});

$("#nexmoe-sidebar a").addClass("mdui-ripple");
mdui.mutation();
