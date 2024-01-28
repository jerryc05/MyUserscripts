// ==UserScript==
// @name          Refresh BOCUSA balance
// @author        jerryc05
// @version       9
// @icon          https://www.bocusa.com/themes/custom/boc/slice/assets/images/favicon.png
// @match         *://*/*
// @run-at        document-body
// @namespace     https://github.com/jerryc05
// @downloadURL   https://raw.githubusercontent.com/jerryc05/MyUserscripts/master/src/bocusa.user.js
// @grant         GM_setValue
// @grant         GM_getValue
// @grant         GM_addValueChangeListener
// @grant         GM_xmlhttpRequest
// @grant         GM_deleteValue
// ==/UserScript==

;(async () => {
  'use strict'

  const GM_VALUE_ID = (GM_info.script.name + ' ' + GM_info.uuid).replaceAll(
    ' ',
    '_'
  )
  const GM_VALUE_RESP_STR_ID = GM_VALUE_ID + ' resp_str'
  const LOADING_STR = 'Loading BOCUSA balance ...'

  const elem = document.createElement('code')
  elem.id = GM_VALUE_ID
  elem.style.position = 'fixed'
  elem.style.top = '0'
  elem.style.left = '0'
  elem.style.zIndex = '99999999'
  elem.style.backgroundColor = 'rgba(0,0,0,0.5)'
  elem.style.color = 'white'
  elem.style.padding = '.5rem'
  elem.style.fontSize = '.8rem'
  elem.style.lineHeight = '1rem'
  elem.textContent = LOADING_STR
  document.body.append(elem)

  // Set the singleton flag
  GM_setValue(GM_VALUE_ID, GM_getValue(GM_VALUE_ID, 0) + 1)

  window.addEventListener('beforeunload', () => {
    GM_setValue(GM_VALUE_ID, GM_getValue(GM_VALUE_ID, 0) - 1)
  })

  // Check if the script is already running
  if (GM_getValue(GM_VALUE_ID, 0) <= 3) {
    while (true) {
      // set loading
      GM_setValue(GM_VALUE_RESP_STR_ID, '')

      const resp_str = await new Promise(r =>
        GM_xmlhttpRequest({
          method: 'POST',
          url: 'https://ebanking.bocusa.com/newpbank/gw/acct/overview',
          headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'sec-ch-ua':
              '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
          },
          onload: resp_ => {
            console.dir(resp_)
            r(resp_.response)
          },
        })
      )
      GM_setValue(GM_VALUE_RESP_STR_ID, resp_str)

      await new Promise(r => setTimeout(r, 60_000))
    }
  }

  GM_addValueChangeListener(
    GM_VALUE_RESP_STR_ID,
    (_name, _old_value, resp_str) => {
      if (!resp_str) {
        // loading
        elem.textContent += '\n' + LOADING_STR
      } else {
        // loaded
        const resp_json = JSON.parse(resp_str)
        elem.textContent =
          parseInt(resp_json._code) === 0
            ? resp_json._data?.acctList
                ?.map(
                  x =>
                    `${x.ACC}: $${parseFloat(x.BOOK_BAL.replaceAll(',', ''))}`
                )
                .join('\n')
            : resp_str
      }
    }
  )
})()
