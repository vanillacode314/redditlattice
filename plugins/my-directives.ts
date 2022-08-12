export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("longpress", {
    mounted: function (el, binding, vNode) {
      // // Make sure expression provided is a function
      // if (typeof binding.value !== "function") {
      //   // Fetch name of component
      //   const compName = vNode.component;
      //   // pass warning to console
      //   let warn = `[longpress:] provided expression '${binding}' is not a function, but has to be`;
      //   if (compName) {
      //     warn += `Found in component '${compName}' `;
      //   }
      //
      //   console.warn(warn);
      // }

      // Define variable
      let pressTimer = null;

      let startY: number = 0;
      // Define funtion handlers
      // Create timeout ( run function after 1s )
      let start = (e) => {
        if (e.type === "click" && e.button !== 0) {
          return;
        }
        startY = e.touches[0].pageY;

        if (pressTimer === null) {
          pressTimer = setTimeout(() => {
            // Run function
            handler(e);
          }, 1000);
        }
      };

      const threshold = 10;
      let move = (e) => {
        if (e.type === "click" && e.button !== 0) {
          return;
        }

        const dy = e.touches[0].pageY - startY;
        if (threshold < Math.abs(dy) && pressTimer !== null) {
          clearTimeout(pressTimer);
        }
      };

      // Cancel Timeout
      let cancel = (e) => {
        // Check if timer has a value or not
        if (pressTimer !== null) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };
      // Run Function
      const handler = (e) => {
        binding.value(e);
      };
      // Add Event listeners
      el.addEventListener("contextmenu", (e) => e.preventDefault());
      el.addEventListener("mousedown", start);
      el.addEventListener("touchstart", start);
      el.addEventListener("touchmove", move);
      // Cancel timeouts if this events happen
      el.addEventListener("click", cancel);
      el.addEventListener("mouseout", cancel);
      el.addEventListener("touchend", cancel);
      el.addEventListener("touchcancel", cancel);
    },
  });
});
