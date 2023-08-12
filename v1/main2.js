let activeIndex = 0;

const list = [
  { name: "hat1", isVisible: true },
  { name: "hat2", isVisible: false },
  { name: "hat3", isVisible: false },
  { name: "hat4", isVisible: false },
  { name: "glasses1", isVisible: false },
  { name: "glasses2", isVisible: false },
  { name: "glasses3", isVisible: false },
  { name: "glasses4", isVisible: false },
  { name: "mustache", isVisible: false },
  { name: "earring", isVisible: false },
  { name: "hair", isVisible: false },
];

document.addEventListener("DOMContentLoaded", function () {
  const setVisible = (button, entities, visible) => {
    if (visible) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
    entities.forEach((entity) => {
      entity.setAttribute("visible", visible);
    });
  };
  list.forEach((item, index) => {
    const button = document.querySelector("#" + item.name);
    const entities = document.querySelectorAll("." + item.name + "-entity");
    setVisible(button, entities, item.isVisible);
    button.addEventListener("click", () => {
      item.isVisible = !item.isVisible;
      setVisible(button, entities, item.isVisible);
    });
  });

  const leftBtn = document.querySelector(".arrow-left");
  const rightBtn = document.querySelector(".arrow-right");

  const controlNavigation = (currentIndex, prevIndex) => {
    const button1 = document.querySelector("#" + list[currentIndex].name);
    if (activeIndex < 0) {
      activeIndex = list.length - 1;
    }
    if (activeIndex >= list.length) {
      activeIndex = 0;
    }
    const button2 = document.querySelector("#" + list[activeIndex].name);
    button1.click();
    button2.click();
  };

  leftBtn.addEventListener("click", () => {
    controlNavigation(activeIndex--, activeIndex);
  });

  rightBtn.addEventListener("click", () => {
    controlNavigation(activeIndex++, activeIndex);
  });
  console.log("loaded");
});
