let activeIndex = 0;

const list = [
  "hat1",
  "hat2",
  "hat3",
  "hat4",
  "glasses1",
  "glasses2",
  "glasses3",
  "glasses4",
  "mustache",
  "earring",
  "hair",
];
const visibles = [
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
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
    const button = document.querySelector("#" + item);
    const entities = document.querySelectorAll("." + item + "-entity");
    setVisible(button, entities, visibles[index]);
    button.addEventListener("click", () => {
      visibles[index] = !visibles[index];
      setVisible(button, entities, visibles[index]);
    });
  });

  const leftBtn = document.querySelector(".arrow-left");
  const rightBtn = document.querySelector(".arrow-right");

  const controlNavigation = (currentIndex, prevIndex) => {
    const button1 = document.querySelector("#" + list[currentIndex]);
    if (activeIndex < 0) {
      activeIndex = list.length - 1;
    }
    if (activeIndex >= list.length) {
      activeIndex = 0;
    }
    const button2 = document.querySelector("#" + list[activeIndex]);
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
