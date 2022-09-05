// ==UserScript==
// @name        RoyStream Helper
// @version     1
// @match       *://*.roystream.com/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=roystream.com
// @supportURL  https://github.com/jerryc05/MyUserscripts
// @author      jerryc05
// @namespace   https://github.com/jerryc05
// ==/UserScript==


setTimeout(() => document.querySelector("#app-content>div>div>div:first-child").classList = [], 0)
document.querySelector("#app-content>div>div>div.col-md-4")?.remove()
for (const x of document.querySelectorAll('[class*="d-flex"]:first-child'))
  x.style.overflow = "hidden"
new MutationObserver((_, o) => {
  const l = document.querySelectorAll('[class^="list-unstyled ps-3 list-children collapse"]')
  for (const x of l)
    $(x).collapse("show")
  if (l) o.disconnect()
}).observe(document.getElementById('app-sidebar'), { childList: true, subtree: true })
