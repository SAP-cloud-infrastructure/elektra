/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
var WebconsoleContainer = (function () {
  let defaults = undefined
  let createDomStructure = undefined
  let addHelpContainer = undefined
  let loadWebconsoleData = undefined
  WebconsoleContainer = class WebconsoleContainer {
    static initClass() {
      let webconsoleHelpSeen
      if (Storage !== "undefined") {
        // save information from local storage in class variable.
        webconsoleHelpSeen = localStorage.getItem("webconsoleHelpSeen")
      }

      defaults = {
        toolbarCssClass: "toolbar",
        buttonsCssClass: "main-buttons",
        holderCssClass: "webconsole-holder",
        helpCssClass: "webconsole-help",
        loadingText: "Loading web shell",
        toolbar: "on",
        title: "Web Shell",
        buttons: null, //['help','reload','close', 'fullscreen']
        effect: "slide",
        height: null, //'viewport'
        closeIcon: "fa fa-close",
        helpIcon: "fa fa-question-circle",
        reloadIcon: "fa fa-refresh",
        fullscreenIcon: "fa fa-expand",
        compressIcon: "fa fa-compress",
        closeText: "Close web shell",
        helpText: "Show help",
        reloadText: "Reload shell",
        fullscreenText: "Toggle full width",
      }

      // create toolbar, buttons and console holder
      createDomStructure = function ($container, settings) {
        if (settings.toolbar === "on") {
          // toolbar is on
          // add toolbar to container
          const $toolbar = $(`<div class='${settings.toolbarCssClass}'/>`).prependTo($container.parent())

          if (settings.title) {
            // title exists
            // add title to toolbar
            $toolbar.append(settings.title)
          }
          if (settings.buttons && settings.buttons.length > 0) {
            // buttons given
            // add buttons container to toolbar
            const $buttons = $(`<div class='${settings.buttonsCssClass}'/>`).appendTo($toolbar)

            // create and add each button to buttons container
            for (let i = 0; i < settings.buttons.length; i++) {
              var button = settings.buttons[i]
              $buttons.append(
                `<a href='#' data-trigger='webconsole:${button}' data-toggle='tooltip' title='${
                  settings[button + "Text"]
                }'><i class='${settings[button + "Icon"]}'/></a>`
              )
            }
          }
        }

        // add webconsole holder to container
        // and return this holder
        return $(`<div class='${settings.holderCssClass}'/>`).appendTo($container)
      }

      // adds help container to console holder
      addHelpContainer = function ($container, settings) {
        // create a container div for help content
        let $helpContent
        let $helpContainer = $container.find(`.${settings.helpCssClass}`)
        if ($helpContainer.length === 0) {
          $helpContainer = $(`<div class='${settings.helpCssClass}'></div>`).appendTo($container).hide()

          // create a container div for help text and show it
          $helpContent = $(`<div class='${settings.helpCssClass}-content'></div>`).appendTo($helpContainer)

          // open help container unless already seen
          if (!webconsoleHelpSeen) {
            $helpContainer.animate({ width: "toggle" }, "400px")
          }

          // set help button to active
          $('[data-trigger="webconsole:help"]').addClass("active")

          // create toggle button and bind click event
          $("<a href='#' class='toggle'><i class='fa fa-close'></i></a>")
            .prependTo($helpContainer)
            .click(function (e) {
              $helpContainer.animate({ width: "toggle" }, "400px")
              $('[data-trigger="webconsole:help"]').toggleClass("active")
              // save information already seen in local storage
              return localStorage.setItem("webconsoleHelpSeen", true)
            })

          // set height
          // $webconsoleHolder = $container.find(".#{settings.holderCssClass}")
          // height = $webconsoleHolder.height()
          const $toolbar = $container.find(`.${settings.toolbarCssClass}`)
          const top = $toolbar.length > 0 ? $toolbar.position().top + $toolbar.outerHeight(true) : 0
          // $helpContainer.css(top: top, height: height)
          $helpContainer.css({ top })
        } else {
          $helpContent = $helpContainer.find(`.${settings.helpCssClass}-content`)
        }

        return $helpContent
      }

      // load credentials for current user (token, identity and webcli endpoints)
      loadWebconsoleData = function (settings) {
        // console.log 'loadWebconsoleData', settings
        let path = window.location.pathname
        if (path.charAt(0) === "/") {
          path = path.substr(1)
        }
        const arr = path.split("/")
        const scope = `${arr[0]}/${arr[1]}`

        const options = {
          dataType: "json",
          type: "GET",
          cache: false,
          url: `/${scope}/webconsole/current-context`,
        }
        return $.ajax(options)
      }
    }

    static init(containerSelector, settings) {
      if (settings == null) {
        settings = {}
      }
      this.$container = $(containerSelector)
      this.settings = $.extend({}, defaults, this.$container.data(), settings)
      this.$holder = createDomStructure(this.$container, this.settings)

      let height = this.settings["height"]
      if (height) {
        height = $(document).height() - this.$container.offset().top - $(".footer").outerHeight(true)
        if (!height || height < 500) {
          height = 500
        }
        this.$container.find(`.${this.settings.holderCssClass}`).css({ height })
      }

      // @$container.css(height: height)

      $('[data-trigger="webconsole:open"]').click(function (e) {
        e.preventDefault()
        if ($(this).hasClass("active")) {
          $(this).removeClass("active")
          return WebconsoleContainer.close()
        } else {
          $(this).addClass("active")
          return WebconsoleContainer.open()
        }
      })

      $('[data-trigger="webconsole:reload"]').click(function (e) {
        e.preventDefault()
        return WebconsoleContainer.reload()
      })

      $('[data-trigger="webconsole:help"]').click((e) => {
        e.preventDefault()
        this.$container.find(`.${this.settings.helpCssClass}`).animate({ width: "toggle" }, "400px")
        return $(e.currentTarget).toggleClass("active")
      })

      $('[data-trigger="webconsole:close"]').click(function (e) {
        e.preventDefault()
        return WebconsoleContainer.close(() => $('[data-trigger="webconsole:open"]').removeClass("active"))
      })

      return $('[data-trigger="webconsole:fullscreen"]').click((e) => {
        e.preventDefault()
        const icon = $(e.currentTarget).find(".fa")

        if (icon.hasClass(`${this.settings.fullscreenIcon}`)) {
          icon.removeClass(`${this.settings.fullscreenIcon}`)
          icon.addClass(`${this.settings.compressIcon}`)
        } else {
          icon.removeClass(`${this.settings.compressIcon}`)
          icon.addClass(`${this.settings.fullscreenIcon}`)
        }

        return WebconsoleContainer.toogleFullscreen()
      })
    }

    static addUnloadHandler() {
      // Protect against accidental browser tab closure while webconsole is active
      // Problem: Users working in the web terminal often use keyboard shortcuts,
      // and it's easy to accidentally hit Cmd+W (Mac) or Ctrl+W (Windows/Linux)
      // which closes the browser tab, terminating their active shell session
      // and losing any unsaved work, running processes, or command history

      // Store reference to the handler so we can remove it later
      // (prevents memory leaks and unwanted confirmations after console is closed)
      this.unloadHandler = function (e) {
        e.preventDefault()
        const confirmationMessage = "You have an active web console session. Are you sure you want to close this tab?"

        // Standard cross-browser way to show confirmation dialog
        // Both e.returnValue and return value are needed for compatibility
        // with different browsers (Chrome, Firefox, Safari, etc.)
        e.returnValue = confirmationMessage
        return confirmationMessage
      }

      // Listen for beforeunload event (triggered when user tries to close tab/window)
      window.addEventListener("beforeunload", this.unloadHandler)
    }

    static removeUnloadHandler() {
      // Clean up the beforeunload event listener to prevent:
      // 1. Memory leaks from lingering event handlers
      // 2. False confirmation dialogs when webconsole is not active
      // 3. Annoying users with unnecessary prompts on normal page navigation

      if (this.unloadHandler) {
        window.removeEventListener("beforeunload", this.unloadHandler)
        this.unloadHandler = null
      }
    }

    static open(callback) {
      // Open console container
      return this.$container.parent().slideDown("slow", function () {
        WebconsoleContainer.load()

        // Add beforeunload handler when webconsole opens
        // This prevents users from accidentally closing the browser tab with Cmd+W/Ctrl+W
        // while working in the web console, which would lose their active terminal session
        // and any unsaved work or running commands
        WebconsoleContainer.addUnloadHandler()
        if (callback) {
          return callback()
        }
      })
    }

    static close(callback) {
      return this.$container.parent().slideUp("slow", function () {
        // Remove beforeunload handler when webconsole closes
        // Once the console is intentionally closed, we no longer need to protect
        // against accidental tab closure since there's no active session to lose
        WebconsoleContainer.removeUnloadHandler()

        if (callback) {
          return callback()
        }
      })
    }

    static toogleFullscreen(callback) {
      const $parentContainer = this.$container.parent()

      const new_width = $parentContainer.data("width") || $(window).width()
      const new_left = $parentContainer.data("left") || -$parentContainer.offset().left

      $parentContainer.data("width", $parentContainer.width())
      $parentContainer.data("left", new_left !== 0 ? 0 : false)

      return this.$container.parent().css({ position: "relative" }).animate({
        width: new_width,
        left: new_left,
      })
    }

    static reload() {
      return this.load(true)
    }

    static load(reload) {
      if (reload == null) {
        reload = false
      }
      if (this.loaded && reload === false) {
        return
      }

      // bind this to self
      const self = this
      // create loading element
      const $loadingHint = $(
        `<div class='loading-hint'><span class='info-text'>${this.settings.loadingText}</span><span class='spinner'></span></div>`
      )
      // set holder's content to loading
      this.$holder.html($loadingHint)

      $loadingHint.append('<span class="status info-text">0%</span>')

      // load token and endpoints
      return loadWebconsoleData(this.settings)
        .error(function (jqXHR, textStatus, errorThrown) {
          const redirectTo = jqXHR.getResponseHeader("Location")
          // response is a redirect
          if (redirectTo && redirectTo.indexOf("/auth/login/") > -1) {
            // just reload to avoid redirect to a no layout page after login
            return window.location.reload()
          }
        })
        .success(function (context, textStatus, jqXHR) {
          $loadingHint.find(".status").text("20%")

          // define function which implements the webconsole load procedure
          const loadConsole = function () {
            $loadingHint.find(".status").text("60%")

            // success
            // load webcli
            return $.ajax({
              url: `${context.webcli_endpoint}/auth/${context.user_name}`,
              beforeSend(request) {
                request.setRequestHeader("X-Auth-Token", context.token)
                return request.setRequestHeader("X-OS-Region", context.region)
              },
              dataType: "json",
              success(data) {
                $loadingHint.find(".status").text("80%")
                // success -> add terminal div to container
                const $cliContent = $(`<iframe id='webcli-content' src='${data.url}' height='100%' width='100%' />`)

                self.$holder.append($cliContent)

                if (context.help_html) {
                  const $helpContainer = addHelpContainer(self.$container, self.settings)
                  $helpContainer.html(context.help_html)
                }

                $loadingHint.remove()

                return (self.loaded = true)
              },
              error(xhr, bleep, error) {
                return $loadingHint.html(
                  `<div class='info-text'>An error has occurred while trying to load your shell. Please try again later. The error was: <br />${xhr.status} - ${error}</div>`
                )
              },
            })
          }

          return loadConsole()
        })
    }
  }
  WebconsoleContainer.initClass()
  return WebconsoleContainer
})()

window.WebconsoleContainer = WebconsoleContainer
