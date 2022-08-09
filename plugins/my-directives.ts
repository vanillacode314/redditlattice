// const onScroll = () => {
//   const dy = window.scrollY - last_known_scroll_position;
//   last_known_scroll_position = window.scrollY;
//
//   if (!ticking) {
//     window.requestAnimationFrame(function () {
//       selected.value = false;
//       if (Math.abs(dy) > threshold) {
//         if (dy > 0) {
//           hidden.value = true;
//         } else {
//           hidden.value = false;
//         }
//       }
//       ticking = false;
//     });
//
//     ticking = true;
//   }
// };
//
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("hide-on-scroll", {
    mounted(el) {
      el.focus();
    },
  });
});
