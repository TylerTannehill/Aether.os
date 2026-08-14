/**
 * Aether Website Tracker
 *
 * Install:
 * <script
 *   src="https://aetheros.pro/aether-tracker.js"
 *   data-aether-tracker="aether_track_..."
 *   defer
 * ></script>
 *
 * The tracker ID is intentionally public.
 * Never place an aether_web_* API key in browser-side code.
 */

(function () {
  "use strict";

  if (window.__AETHER_WEBSITE_TRACKER_LOADED__) {
    return;
  }

  window.__AETHER_WEBSITE_TRACKER_LOADED__ = true;

  var script =
    document.currentScript ||
    Array.prototype.slice
      .call(document.getElementsByTagName("script"))
      .reverse()
      .find(function (item) {
        return item && item.getAttribute("data-aether-tracker");
      });

  if (!script) {
    return;
  }

  var trackerId = (
    script.getAttribute("data-aether-tracker") || ""
  ).trim();

  if (!trackerId) {
    return;
  }

  var configuredEndpoint = (
    script.getAttribute("data-aether-endpoint") || ""
  ).trim();

  var endpoint;

  if (configuredEndpoint) {
    endpoint = configuredEndpoint;
  } else {
    try {
      endpoint =
        new URL(script.src, window.location.href).origin +
        "/api/integrations/website/track";
    } catch (_error) {
      endpoint =
        "https://aetheros.pro/api/integrations/website/track";
    }
  }

  var lastTrackedUrl = null;

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  function cleanText(value, maxLength) {
    if (value === null || value === undefined) {
      return null;
    }

    var cleaned = String(value).trim();

    if (!cleaned) {
      return null;
    }

    return cleaned.slice(0, maxLength || 500);
  }

  function currentPath() {
    return (
      window.location.pathname +
      window.location.search +
      window.location.hash
    ).slice(0, 2048);
  }

  function safeMetadata(metadata) {
    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return {};
    }

    var safe = {};
    var keys = Object.keys(metadata).slice(0, 25);

    keys.forEach(function (key) {
      var value = metadata[key];

      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        safe[key] =
          typeof value === "string"
            ? value.slice(0, 1000)
            : value;
      }
    });

    return safe;
  }

  function send(eventName, details) {
    details = details || {};

    var payload = {
      tracker_id: trackerId,

      event:
        cleanText(eventName, 100) ||
        "interaction",

      path: cleanText(
        details.path || currentPath(),
        2048
      ),

      url: cleanText(
        details.url || window.location.href,
        4096
      ),

      referrer: cleanText(
        details.referrer !== undefined
          ? details.referrer
          : document.referrer,
        4096
      ),

      title: cleanText(
        details.title !== undefined
          ? details.title
          : document.title,
        500
      ),

      label: cleanText(
        details.label,
        500
      ),

      metric_date: new Date().toISOString(),

      metadata: safeMetadata(
        details.metadata
      ),
    };

    var body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob(
          [body],
          {
            type: "application/json",
          }
        );

        if (
          navigator.sendBeacon(
            endpoint,
            blob
          )
        ) {
          return;
        }
      }
    } catch (_error) {
      // Fall through to fetch.
    }

    try {
      fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: body,
      }).catch(function () {
        // Analytics must never interfere
        // with the campaign website.
      });
    } catch (_error) {
      // Analytics must never interfere
      // with the campaign website.
    }
  }

  function trackPageView(force) {
    var url = window.location.href;

    if (
      !force &&
      lastTrackedUrl === url
    ) {
      return;
    }

    lastTrackedUrl = url;

    send("page_view", {
      metadata: {
        viewport_width:
          window.innerWidth,

        viewport_height:
          window.innerHeight,
      },
    });
  }

  function findClickableElement(target) {
    if (
      !target ||
      !target.closest
    ) {
      return null;
    }

    return target.closest(
      "a," +
      "button," +
      "[role='button']," +
      "input[type='button']," +
      "input[type='submit']"
    );
  }

  function describeElement(element) {
    if (!element) {
      return null;
    }

    var ariaLabel =
      element.getAttribute(
        "aria-label"
      );

    var dataLabel =
      element.getAttribute(
        "data-aether-label"
      );

    var text =
      element.innerText ||
      element.value ||
      element.title;

    return cleanText(
      dataLabel ||
        ariaLabel ||
        text,
      500
    );
  }

  document.addEventListener(
    "click",

    function (event) {
      var element =
        findClickableElement(
          event.target
        );

      if (!element) {
        return;
      }

      var href =
        element.tagName === "A"
          ? cleanText(
              element.getAttribute(
                "href"
              ),
              2048
            )
          : null;

      send("click", {
        label:
          describeElement(element),

        metadata: {
          element:
            element.tagName.toLowerCase(),

          href: href,
        },
      });
    },

    true
  );

  document.addEventListener(
    "submit",

    function (event) {
      var form = event.target;

      if (
        !form ||
        form.tagName !== "FORM"
      ) {
        return;
      }

      /*
       * Never collect form field values.
       *
       * Campaign websites may contain
       * names, emails, phone numbers,
       * donation information, or other
       * sensitive supporter data.
       *
       * We only record that a form
       * was submitted.
       */

      send("form_submit", {
        label: cleanText(
          form.getAttribute(
            "data-aether-label"
          ) ||
            form.getAttribute(
              "aria-label"
            ) ||
            form.getAttribute(
              "name"
            ) ||
            form.id ||
            "Form",

          500
        ),

        metadata: {
          form_id: cleanText(
            form.id,
            250
          ),

          form_name: cleanText(
            form.getAttribute(
              "name"
            ),
            250
          ),
        },
      });
    },

    true
  );

  function schedulePageView() {
    window.setTimeout(
      function () {
        trackPageView(false);
      },
      0
    );
  }

  try {
    history.pushState =
      function () {
        var result =
          originalPushState.apply(
            this,
            arguments
          );

        schedulePageView();

        return result;
      };

    history.replaceState =
      function () {
        var result =
          originalReplaceState.apply(
            this,
            arguments
          );

        schedulePageView();

        return result;
      };
  } catch (_error) {
    // History instrumentation
    // is optional.
  }

  window.addEventListener(
    "popstate",
    schedulePageView
  );

  window.addEventListener(
    "hashchange",
    schedulePageView
  );

  window.AetherWebsiteTracker = {
    track: function (
      eventName,
      details
    ) {
      send(
        eventName,
        details || {}
      );
    },

    pageView: function () {
      trackPageView(true);
    },
  };

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",

      function () {
        trackPageView(true);
      },

      {
        once: true,
      }
    );
  } else {
    trackPageView(true);
  }
})();