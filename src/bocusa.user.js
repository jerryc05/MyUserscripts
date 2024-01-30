// @ts-nocheck

// ==UserScript==
// @name          Refresh BOCUSA balance
// @author        jerryc05
// @version       15
// @icon          https://www.bocusa.com/themes/custom/boc/slice/assets/images/favicon.png
// @match         *://*/*
// @run-at        document-body
// @namespace     https://github.com/jerryc05
// @downloadURL   https://raw.githubusercontent.com/jerryc05/MyUserscripts/master/src/bocusa.user.js
// @noframes
// @grant         GM.info
// @grant         GM_log
// @grant         GM.setValue
// @grant         GM.getValue
// @grant         GM_addValueChangeListener
// @grant         GM.xmlHttpRequest
// ==/UserScript==

;(async () => {
  'use strict'

  const GM_VALUE_ID = GM.info.script.name.replaceAll(' ', '_')
  const GM_VALUE_ID_LAST_REQUESTED = GM_VALUE_ID + ' last requested'
  const GM_VALUE_ID_RESP_STR = GM_VALUE_ID + ' resp_str'

  const LOADING_STR = ' ...'

  const elem = document.createElement('code')
  elem.id = GM_VALUE_ID
  elem.style.position = 'fixed'
  elem.style.top = '0'
  elem.style.left = '0'
  elem.style.zIndex = '99999999'
  elem.style.pointerEvents = 'none'
  elem.style.backgroundColor = 'rgba(0,0,0,0.5)'
  elem.style.color = 'white'
  elem.style.padding = '8px'
  elem.style.fontSize = '12px'
  elem.style.lineHeight = '16px'
  document.body.append(elem)

  GM_addValueChangeListener(
    GM_VALUE_ID_RESP_STR,
    (_name, _old_value, respDatasOrNull) => {
      // loading
      if (!respDatasOrNull) {
        elem.textContent += LOADING_STR
      } // loaded
      else {
        /** @type any[] */
        const respDatas = respDatasOrNull
        elem.textContent = respDatas
          .map(
            x =>
              `BofChina ${x.ACC}: $${parseFloat(
                x.BOOK_BAL.replaceAll(',', '')
              )}`
          )
          .join('\n')
      }
    }
  )

  while (true) {
    const lastRequested = parseInt(
      await GM.getValue(GM_VALUE_ID_LAST_REQUESTED, 0)
    )
    // GM_log(
    //   `diff=${
    //     Date.now() - lastRequested
    //   } last=${lastRequested} now=${Date.now()}`
    // )

    if (!elem.textContent || lastRequested + 60_000 /* 1min */ <= Date.now()) {
      // set last requested
      GM.setValue(GM_VALUE_ID_LAST_REQUESTED, Date.now())

      // set loading
      GM.setValue(GM_VALUE_ID_RESP_STR, '')

      // GM.xmlHttpRequest
      /** @type string */
      const resp_text = await new Promise(r => {
        GM.xmlHttpRequest({
          method: 'POST',
          url: 'https://ebanking.bocusa.com/newpbank/gw/accts/ft',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'sec-ch-ua':
              '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
          },
          onload: response => {
            r(response.responseText)
          },
          onerror: response => {
            GM_log(response)
          },
          anonymous: false,
          referrer: 'https://ebanking.bocusa.com/ibank/account/overview',
        })
      })
      GM_log(resp_text)

      /** @type string[] */
      const accNos = JSON.parse(resp_text)._data?.map(x => x.accountNo)

      const promises = accNos.map(
        accNo =>
          new Promise(r => {
            GM.xmlHttpRequest({
              method: 'POST',
              url: 'https://ebanking.bocusa.com/newpbank/gw/acct/bal',
              headers: {
                Accept: 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                'Content-Type': 'application/json;charset=UTF-8',
                'sec-ch-ua':
                  '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
              },
              data: JSON.stringify({ accountNo: accNo }),
              onload: response => {
                /** @type object */
                const resp_json = JSON.parse(response.responseText)
                GM_log(resp_json)
                r(resp_json._data.respData)
              },
              onerror: response => {
                GM_log(response)
              },
              anonymous: false,
            })
          })
      )

      GM.setValue(GM_VALUE_ID_RESP_STR, await Promise.all(promises))
    }

    await new Promise(r => setTimeout(r, 30_000 /* 30s */))
  }
})()
