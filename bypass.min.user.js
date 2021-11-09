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
"use strict";(async()=>{tf.wasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/");const e=tf.setBackend("wasm"),t=cocoSsd.load(),o=new MutationObserver(function(){const o=document.querySelectorAll(".task-image > .image-wrapper > .image");o&&o.length>8&&(this.disconnect(),async function(o){setTimeout(async()=>{await e,tf.model=await t,console.log("hCaptchaBypass: tensorflow initialized!"),console.log("hCaptchaBypass: validating first set of images..."),await async function e(t,o){if(o>1)return;const n=document.querySelector(".prompt-text").innerText.replace(/Please click each image containing (a|an) /,"").toLowerCase();for(const e of t){const t=e.parentNode.parentNode,o=await c(e),a=await tf.model.detect(o);a.forEach(e=>{console.debug(`hCaptchaBypass: the word is '${n}', tensorflow found '${e.class}'`),n==e.class.toLowerCase()&&t.click()})}const a=document.querySelector(".button-submit");"Verify"==a.children[0].textContent?setTimeout(()=>{console.log("hCaptchaBypass: submitting results..."),a.click()},1e3):(console.log("hCaptchaBypass: validating second set of images..."),a.click(),setTimeout(()=>{const n=new Set(t),a=Array.from(document.querySelectorAll(".task-image > .image-wrapper > .image"));a.filter(e=>!n.has(e));e(a,o+1)},2e3))}(o,0)},2e3)}(o))}),n=new MutationObserver(function(){const e=document.querySelector("#checkbox");e&&null!=e.getAttribute("aria-checked")&&(this.disconnect(),"false"==e.getAttribute("aria-checked")&&e.click())}),a={childList:!0,subtree:!0};window.location.href.includes("hcaptcha-checkbox")?(console.log("hCaptchaBypass: found the checkbox, clicking..."),n.observe(document,a)):window.location.href.includes("hcaptcha-challenge")?(console.log("hCaptchaBypass: found the challenge, attempting to solve..."),console.log("hCaptchaBypass: setting up tensorflow..."),o.observe(document,a)):console.warn("hCaptchaBypass: found an unknown iframe, ignoring...");const c=e=>new Promise((t,o)=>{const n=e.style.background.match(/(?<=\(\").+?(?=\"\))/g),a=new Image;a.crossOrigin="Anonymous",a.onload=(()=>t(a)),a.onerror=o,a.src=n&&0!=n[0]?n[0]:void 0})})();