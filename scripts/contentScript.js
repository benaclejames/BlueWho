// First, we need to inject a script into the page to get access to the React props
// This is done by creating a script element and appending it to the page
console.log("Appending script to page");
const s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/getReactProps.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
