//
// ==UserScript==
// @name         simple hcaptcha bypass
// @description  a simple userscript to bypass hCaptcha popups
// @namespace    https://github.com/frankmoskal/simple-hcaptcha-bypass
// @version      0.1
// @homepageUrl  https://github.com/frankmoskal/simple-hcaptcha-bypass
// @supportURL   https://github.com/frankmoskal/simple-hcaptcha-bypass/issues
// @license      MIT
//
// @match        https://*.hcaptcha.com/*hcaptcha-challenge*
// @match        https://*.hcaptcha.com/*hcaptcha-checkbox*
// @connect      https://*.hcaptcha.com/*
// @connect      https://cdn.jsdelivr.net/
// @run-at       document-start
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js
// @require      https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js
// ==/UserScript==
//

"use strict";

(async () => {
  // todo: promises could conflict?
  tf.wasm.setWasmPaths(
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/"
  );
  const wasmPromise = tf.setBackend("wasm");
  const cocoSsdPromise = cocoSsd.load();

  const challengeObserver = new MutationObserver(function () {
      const images = document.querySelectorAll(
        ".task-image > .image-wrapper > .image"
      );

      if (images && images.length > 8) {
        this.disconnect();
        hCaptchaBypass(images);
      }
    }),
    checkboxObserver = new MutationObserver(function () {
      const checkbox = document.querySelector("#checkbox");

      if (checkbox && checkbox.getAttribute("aria-checked") != null) {
        this.disconnect();
        if (checkbox.getAttribute("aria-checked") == "false") {
          checkbox.click();
        }
      }
    }),
    observerSettings = {
      childList: true,
      subtree: true,
    };

  if (window.location.href.includes("hcaptcha-checkbox")) {
    console.log("hCaptchaBypass: found the checkbox, clicking...");
    checkboxObserver.observe(document, observerSettings);
  } else if (window.location.href.includes("hcaptcha-challenge")) {
    console.log("hCaptchaBypass: found the challenge, attempting to solve...");
    console.log("hCaptchaBypass: setting up tensorflow...");
    challengeObserver.observe(document, observerSettings);
  } else {
    console.warn("hCaptchaBypass: found an unknown iframe, ignoring...");
  }

  const loadImage = (image) =>
    new Promise((resolve, reject) => {
      const url = image.style.background,
        match = url.match(/(?<=\(\").+?(?=\"\))/g),
        img = new Image();

      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = !match || match[0] == 0 ? undefined : match[0];
    });

  async function hCaptchaSolve(images, depth) {
    if (depth > 1) {
      return;
    }

    const word = document
      .querySelector(".prompt-text")
      .innerText.replace(/Please click each image containing (a|an) /, "")
      .toLowerCase();

    for (const image of images) {
      const parent = image.parentNode.parentNode,
        img = await loadImage(image),
        predictions = await tf.model.detect(img);

      predictions.forEach((p) => {
        console.debug(
          `hCaptchaBypass: the word is '${word}', tensorflow found '${p.class}'`
        );
        if (word == p.class.toLowerCase()) {
          parent.click();
        }
      });
    }

    const submit = document.querySelector(".button-submit");

    if (submit.children[0].textContent == "Verify") {
      setTimeout(() => {
        console.log("hCaptchaBypass: submitting results...");
        submit.click();
      }, 1000);
    } else {
      console.log("hCaptchaBypass: validating second set of images...");
      submit.click();
      setTimeout(() => {
        const firstGroup = new Set(images),
          secondGroup = Array.from(
            document.querySelectorAll(".task-image > .image-wrapper > .image")
          ),
          result = secondGroup.filter((x) => !firstGroup.has(x));

        hCaptchaSolve(secondGroup, depth + 1);
      }, 2000);
    }
  }

  async function hCaptchaBypass(images) {
    setTimeout(async () => {
      await wasmPromise;
      tf.model = await cocoSsdPromise;
      console.log("hCaptchaBypass: tensorflow initialized!");
      console.log("hCaptchaBypass: validating first set of images...");
      await hCaptchaSolve(images, 0);
    }, 2000);
  }
})();
