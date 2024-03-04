// ==UserScript==
// @name         Weee Helper
// @author       jerryc05
// @description  Weee helper
// @namespace    https://github.com/jerryc05
// @downloadURL  https://github.com/jerryc05/MyUserscripts/raw/master/src/weee.user.js
// @version      15
// @match        https://sayweee.com/*
// @match        https://*.sayweee.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sayweee.com
// @grant        GM_log
// ==/UserScript==

;(() => {
  /**
   *
   * @param {(...any)=>void} f
   * @param {number} delay
   * @returns
   */
  function throttle(f, delay) {
    let timerFlag = null // Variable to keep track of the timer

    // Returning a throttled version
    return (/** @type {any} */ ...args) => {
      if (timerFlag === null) {
        // If there is no timer currently running
        f(...args) // Execute the main function
        timerFlag = setTimeout(() => {
          // Set a timer to clear the timerFlag after the specified delay
          timerFlag = null // Clear the timerFlag to allow the main function to be executed again
        }, delay)
      }
    }
  }

  //
  //
  //
  //
  //

  /**
   *
   * @param {Element} cartTextEl
   */
  function updCartText(cartTextEl) {
    GM_log(`${updCartText.name} start!`)
    if (cartTextEl != null) {
      const matchedAuthToken = document.cookie.match(/auth_token=([^;]+)/)
      if (matchedAuthToken != null && matchedAuthToken.length >= 2) {
        const authToken = matchedAuthToken[1]
        fetch('https://api.sayweee.net/ec/so/porder/v3', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
          .then(x => x.json())
          .then(x => {
            const section = x.object.sections[0]
            cartTextEl.textContent = `${section.quantity} 件 $${section.total_price_with_activity}`
          })
      }
    }
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

  const DEFAULT = 'Default'
  /**
   *
   * @param {HTMLSelectElement} s
   */
  const onSelect = throttle((s, ...args) => {
    GM_log(`onSelect start! ${args}`)
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
  }, 1000)

  function mainFn() {
    // show total amount in cart
    const cartTextEl = document.querySelector(
      '[class*="miniCartInHeaderText_"]'
    )
    if (cartTextEl != null) updCartText(cartTextEl)

    // show discount rate
    for (const headerEl of document.querySelectorAll(
      '[class*="ProductCard_imgHeader___"]'
    )) {
      if (!(headerEl instanceof HTMLElement)) continue
      /** @type {HTMLElement|null} */
      let aEl = headerEl
      for (;;) {
        if (aEl == null || aEl instanceof HTMLAnchorElement) break
        aEl = aEl.parentElement
      }
      if (aEl) {
        const [p, b] = parsePrice(aEl)
        if (b) {
          const labelEl =
            headerEl.querySelector('[class*="ProductCard_label_"]') ??
            headerEl.firstElementChild
          if (labelEl instanceof HTMLElement) {
            labelEl.textContent = `${parseFloat(
              (((b - p) / b) * 100).toFixed(2)
            )}% $${parseFloat((b - p).toFixed(2))}`
            labelEl.style.fontWeight = 'bold'
            labelEl.style.backgroundColor = 'red'
          }
        }
      }
    }

    // remove refer text
    document.querySelector('[class*="referFriendText_"]')?.remove()

    // sort by discount rate/amount
    while (window.location.pathname.includes('category/')) {
      const sortElId = 'discount_sort'
      let s = document.getElementById(sortElId)
      if (s instanceof HTMLSelectElement) {
        onSelect(s, 0)
        break
      }
      const h = document.querySelector('[class*="category_resultHeader_"]')
      if (!h) break
      s = document.createElement('select')
      s.id = sortElId
      for (const x of [DEFAULT, 'Discount %', 'Discount $']) {
        const l = document.createElement('option')
        l.text = x
        l.value = x
        if (x === DEFAULT) l.selected = true
        s.append(l)
      }
      if (s instanceof HTMLSelectElement) s.onchange = () => onSelect(s, 1)
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
