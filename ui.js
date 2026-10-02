(function(){
  function getScreens(){
    return Array.from(document.querySelectorAll('.screen'));
  }

  window.UI = {
    showScreen(screenId){
      getScreens().forEach((screen) => {
        screen.classList.toggle('active', screen.id === screenId);
      });
    },

    hideAllScreens(){
      getScreens().forEach((screen) => screen.classList.remove('active'));
    }
  };
})();
