// ==UserScript==
// @name         Weee Helper
// @author       jerryc05
// @description  Weee helper
// @namespace    https://github.com/jerryc05
// @downloadURL  https://github.com/jerryc05/MyUserscripts/raw/master/src/weee.user.js
// @version      8
// @match        https://sayweee.com/*
// @match        https://*.sayweee.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sayweee.com
// ==/UserScript==

;(() => {
  // show total amount in cart
  const cartTextEl = document.querySelector('[class*="miniCartInHeaderText_"]')
  if (cartTextEl) {
    const updCartText = () =>
      fetch('https://api.sayweee.net/ec/so/porder/v3', {
        headers: {
          Authorization: `Bearer ${
            (document.cookie.match(/auth_token=([^;]+)/) || ['', ''])[1]
          }`,
        },
      })
        .then(x => x.json())
        .then(x => {
          const section = x.object.sections[0]
          cartTextEl.textContent = `${section.quantity} 件 $${section.total_price_with_activity}`
        })
    updCartText()
    new MutationObserver(updCartText).observe(cartTextEl, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  //
  //
  //
  //
  //

  /**
   * @param   {Element} x
   * @returns {[number, number|null]}
   */
  function parsePrice(x) {
    const p = parseFloat(
      x.querySelector('[class*="producsPrice"]')?.lastChild?.textContent ?? ''
    )
    const b = x.querySelector('[class*="basePrice_"]')
    return [p, b ? parseFloat(b.lastChild?.textContent ?? '') : null]
  }

  //
  //
  //
  //
  //

  function mainFn() {
    // show discount rate
    for (const labelEl of document.querySelectorAll(
      '[class*="ProductCard_label_"]'
    )) {
      if (!(labelEl instanceof HTMLElement)) continue

      /** @type {HTMLElement|null} */
      let aEl = labelEl
      for (;;) {
        if (aEl == null || aEl instanceof HTMLAnchorElement) break
        aEl = aEl.parentElement
      }
      if (aEl) {
        const [p, b] = parsePrice(aEl)
        if (b) {
          labelEl.textContent = `${parseFloat(
            (((b - p) / b) * 100).toFixed(2)
          )}% $${parseFloat((b - p).toFixed(2))}`
          labelEl.style.fontWeight = 'bold'
        }
      }
    }

    // remove refer text
    document.querySelector('[class*="referFriendText_"]')?.remove()

    // sort by discount rate/amount
    while (window.location.pathname.includes('category/')) {
      const sortElId = 'discount_sort'
      if (document.getElementById(sortElId)) break
      const h = document.querySelector('[class*="category_resultHeader_"]')
      if (!h) break
      const DEFAULT = 'Default'
      const s = document.createElement('select')
      s.id = sortElId
      for (const x of [DEFAULT, 'Discount %', 'Discount $']) {
        const l = document.createElement('option')
        l.text = x
        l.value = x
        if (x === DEFAULT) l.selected = true
        s.append(l)
      }
      s.onchange = () => {
        if (s.value === DEFAULT) return
        const items = document.querySelector('[class*="listContent_"]')
        if (items) {
          const children = [...items.children].sort((a, b) => {
            const [p1, b1] = parsePrice(a)
            const [p2, b2] = parsePrice(b)
            if (!b2) return 0
            if (!b1) return 1
            return s.value.includes('%')
              ? (p1 - b1) / p1 - (p2 - b2) / p2
              : p1 - b1 - (p2 - b2)
          })
          for (const x of children) items.appendChild(x)
        }
      }
      h.insertBefore(s, h.lastChild)
      break
    }
  }
  mainFn()
  new MutationObserver(mainFn).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
})()
