import {Octokit} from "octokit";

async function runIt() {
//*********************************************

// todo browser base function
  const brWindow = {
    state: {
      normal: "normal",
      minimized: "minimized",
      maximized: "maximized",
      fullscreen: "fullscreen",
      docked: "docked",
    },
    type: {
      normal: "normal",
      popup: "popup",
      panel: "panel",
      detached_panel: "detached_panel",
    }
  }

  /**
   *
   * @param url
   * @param newWindow
   * @param focused
   * @param state
   * @param active
   * @returns {Promise<{tabId: number, windowId: number}|{tabId: number}>}
   */
  async function brTabCreate(
    {
      url,
      newWindow = true,
      focused = false,
      state = brWindow.state.minimized,
      active = false,
    }) {
    if (newWindow) {
      let data = {
        url,
        focused,
        state,
        allowScriptsToClose: true,
        // left: 0, top: 0, width: 1, height: 1,
      };
      if (focused) {
        delete data.state
      }

      let window = await browser.windows.create(data);
      let windowId = window.id;
      let tab = window.tabs.pop();
      let tabId = tab.id;
      return {tabId, windowId};
    } else {
      let tab = await browser.tabs.create({
        url,
        active
      })
      let tabId = tab.id;
      return {tabId};
    }
  }

  /**
   *
   * @param tabIds{number| [number]}
   * @return {Promise<void>}
   */
  async function brTabRemove(tabIds) {
    try {
      if (tabIds) {
        await browser.tabs.remove(tabIds);
      }
    } catch (e) {
    }
  }

  /**
   *
   * @param tabId
   * @param url
   * @returns {Promise<void>}
   */
  async function brTabUpdateUrl(tabId, url) {
    await brTabUpdate(tabId, {url});
  }

  async function brTabUpdate(tabId, updateProperties) {
    await browser.tabs.update(tabId, updateProperties);
  }


  /**
   *
   * @param searchString
   * @returns {Promise<null|{tabId: number}>}
   */
  async function brTabQueryOne({searchString, matchType = 'end'}) {
    try {
      let tabs = await browser.tabs.query({});

      let map = tabs
        .map(value => {
          return {
            tabId: value.id,
            url: value.url
          }
        });
      let filter = map
        .filter(value => value.url.endsWith(searchString));

      let tab = filter.pop();

      let tabId = tab.id;
      return tabId
    } catch (e) {
      return null
    }
  }

  /**
   *
   * @param message{ {
   *          title:String,
   *          text:String,
   *          }}
   * @returns {Promise<void>}
   */
  async function brNotification(message) {
    let {title, text} = message;
    let textDefault = '';
    text = text ? text : textDefault;

    let notificationId = 'cake-notification';
    let type = 'basic';

    let timeout = 3;
    timeout = message.hasOwnProperty('timeout')
      ? message.timeout
      : timeout;

    await browser.notifications.create(notificationId, {
      type,
      title,
      message: text,
      eventTime: timeout * 1000,
    });
  }

  const baseFunc = {
    waitHowLongTime: async function waitHowLongTime(timeout) {
      await new Promise(res => setTimeout(res, timeout));
    },
    checkLength: function checkLength(value) {
      return value && value.trim().length >= 1
    },
    getDateCurrent:
      /**
       *
       * @returns {string} eg: 2024_1_12_19_03_49
       */
      function getDateCurrent() {
        let date = new Date();
        let localeDateString = date.toLocaleDateString().replace(/\//g, '_');
        let localeTimeString = date.toLocaleTimeString().replace(/\:/g, '_');
        let dateCurrent = `${localeDateString}_${localeTimeString}`
        return dateCurrent;
      },

  }

//------------------------------------------------

  async function storageGet(k) {
    try {
      let objGet = await browser.storage.local.get(k);
      let v = objGet[k]
      return v ? v : null;
    } catch (e) {
      return null;
    }
  }

  async function storageGetAll() {
    try {
      let obj = await browser.storage.local.get();
      return obj;
    } catch (e) {
      return null;
    }
  }

  async function storageRemove(k) {
    try {
      await browser.storage.local.remove(k);
    } catch (e) {
    }
  }

  async function storageSet(k, v) {
    let objNew = {}
    objNew[k] = v;
    await browser.storage.local.set(objNew)
  }

  async function storageSetNull(k) {
    let objNew = {}
    objNew[k] = null;
    await browser.storage.local.set(objNew)
  }

//------------------------------------------------

// services

  async function serviceGetSettingGithub() {
    async function getSetting() {
      let obj = {}

      for (const value of Object.keys(storageKeySettingGithub())) {
        let k = value
        let v = await storageGet(value)
        obj[k] = v;
      }

      return obj
    }

    return await getSetting();
  }

  async function serviceStorageUpdateGistId(id) {
    await storageSet(storageKeySettingGithub().GIST_ID, id)
  }

  /**
   * if dont have value, update it!
   * @param html_url
   * @returns {Promise<void>}
   */
  async function serviceStorageUpdateGistHtmlUrl(html_url) {
    await storageSet(storageKey().GIST_HTML_URL, html_url)
  }

  async function servicePatchToGist(TOKEN, GIST_ID, FILENAME, content) {
    if (
      baseFunc.checkLength(TOKEN)
      && baseFunc.checkLength(GIST_ID)
      && baseFunc.checkLength(FILENAME)
    ) {
      const octokit = new Octokit({
        auth: `${TOKEN}`,
      });

      let files = {};
      files[FILENAME] = {content}

      try {
        let responsePatch = await octokit.request(`PATCH /gists/${GIST_ID}`, {
          gist_id: `${GIST_ID}`,
          files,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        await brNotification(
          {title: 'success', text: 'patch gist ok!'}
        )
        let id = responsePatch.data.id;
        await serviceStorageUpdateGistId(id);
        let html_url = responsePatch.data.html_url;
        await serviceStorageUpdateGistHtmlUrl(html_url);

      } catch (e) {
        try {
          let responsePost = await octokit.request('POST /gists', {
            description: '',
            public: false,
            files,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          });
          await brNotification(
            {title: 'success', text: 'post gist ok!'}
          )

          let id = responsePost.data.id;
          await serviceStorageUpdateGistId(id);
          let html_url = responsePost.data.html_url;
          await serviceStorageUpdateGistHtmlUrl(html_url);
        } catch (e) {
          await brNotification(
            {
              title: 'post gist error',
              text: 'maybe the TOKEN expired!'
            }
          )
        }
      }

    } else {
      let url = "https://docs.github.com/en/authentication/" +
        "keeping-your-account-and-data-secure/" +
        "managing-your-personal-access-tokens" +
        "#creating-a-fine-grained-personal-access-token"
      await brTabCreate({
          url, state: brWindow.state.maximized
        }
      )
      await brNotification(
        {
          title: 'token error',
          text: `create new one then fill it!`
        }
      )
    }
  }

  async function serviceGetUrlUblockMyFilters() {
    let id = "uBlock0@raymondhill.net"
    let info = await browser.management.get(id)
    // "moz-extension://6c845a4f-e9cc-4826-9132-3346989c8c75/dashboard.html"
    let optionsUrl = info.optionsUrl;
    let url = `${optionsUrl}#1p-filters.html`
    return url
  }

  /**
   *
   * @param message{{
   *          content: string,
   *
   * }}
   * @returns {Promise<void>}
   */
  async function serviceSyncUblockMyFiltersToGist(message) {
    let {content} = message
    let {TOKEN, GIST_ID, FILENAME} = await serviceGetSettingGithub()
    await servicePatchToGist(TOKEN, GIST_ID, FILENAME, content);

    if (false){
      let url = await serviceGetUrlUblockMyFilters()
      let {tabId} = await brTabCreate({
        url, state: brWindow.state.maximized
      });

      let urlPrefix = url
      /**
       * @param details{ browser.webNavigation._OnCompletedDetails}
       * @returns {Promise<void>}
       */
      let cb = async (details) => {
        if (details.tabId === tabId) {
          browser.webNavigation.onCompleted.removeListener(cb)
          let detailUrl = details.url;
          const target = Object.assign({}, args, {detailUrl,});
          await useAssignDoWhat(tabId, target);
        }
      };
      browser.webNavigation.onCompleted.addListener(cb, {
        url: [{urlPrefix}]})
      async function useAssignDoWhat(tabId, assign) {
        await browser.scripting.executeScript({
          target: {tabId},
          args: [assign],
          func: async (message) => {
            if (message) {
              document.querySelector(".CodeMirror-code").textContent




            }
            // todo end if (message)
          }
        });
      }
    }
  }

// ---------------------------------------------------------

// actions
  async function actPatchToGist(message){
    let {content} = message
    let {TOKEN, GIST_ID, FILENAME} = await serviceGetSettingGithub()
    await servicePatchToGist(TOKEN, GIST_ID, FILENAME, content);
  }

  async function actTabCreateGistHtml() {
    let url = await storageGet(storageKey().GIST_HTML_URL)
    if (url) {
      await brTabCreate({
        url, focused: true
      })
    }
  }

// --------------------------------------------------------

// initial
  function storageKey() {
    return {
      GIST_HTML_URL: 'GIST_HTML_URL',
    }
  }

  function storageKeySettingGithub() {
    return {
      GIST_ID: 'GIST_ID',
      TOKEN: 'TOKEN',
      FILENAME: 'FILENAME',
    }
  }

  async function initialStorage() {
    function storageValueDefault() {
      return {
        GIST_ID: `GIST_ID`,
        TOKEN: ``,
        FILENAME: `ublock_my_filters`,

        updateMode: `updateOneFile`,

        GIST_HTML_URL: null
      }
    }

    for (let k in storageValueDefault()) {

      let value = await storageGet(k);
      if (value) {
      } else {
        let valueDefault = storageValueDefault()[k];
        await storageSet(k, valueDefault)
      }
    }
  }

  function initialCustomMethod() {
    Array.prototype.getFirst = function () {
      return [].concat(this).at(0) || null
    }
  }

  function initialRuntimeOnMessage() {
    browser.runtime.onMessage.addListener(async (message) => {
      let keyAct = "act";
      let act = message[keyAct];
      delete message[keyAct];

      switch (act) {
        case 'actTabCreateGistHtml':
          await actTabCreateGistHtml(message)
          break

        case 'actPatchToGist':
          await actPatchToGist(message)
          break

      }
    });
  }

  function initialCreateMenu() {
    browser.menus.create({
      id: 'cmSyncUblockMyFiltersToGist',
      title: 'Sync ublock MyFilters To Gist',
      contexts: [
        'tab',
        'page'
      ],
      onclick: async (info, tab) => {
        await serviceSyncUblockMyFiltersToGist({
          content: info.selectionText
        })
        // todo end
      },
    }, null);
  }


//------------------------------------------------------------------------------

//------------------------------------------------------------------------------

// initial()

  initialCustomMethod()
// todo storage
  initialStorage().then()
  initialRuntimeOnMessage()
  initialCreateMenu()

}

runIt();
























