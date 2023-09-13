let activeIndex = 0;

const list = [
  { name: "hat1", isVisible: false },
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
  { name: "hair1", isVisible: false },
  { name: "hair2", isVisible: false },
  { name: "hair3", isVisible: false },
  { name: "hair4", isVisible: false },
  { name: "hair5", isVisible: true },
  { name: "mask1", isVisible: false },
  { name: "mask2", isVisible: false },
  { name: "mask3", isVisible: false },
  { name: "mask4", isVisible: false },
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

  const handleVisibility = (index, value) => {
    const entity = document.querySelector("." + list[index].name + "-entity");
    let item = list[index];
    entity.setAttribute("visible", value);
    item.isVisible = value;
  };

  const resetActiveIndex = () => {
    activeIndex = 0;
  };

  const handlePrev = () => {
    if (activeIndex === null) {
      resetActiveIndex();
    }
    handleVisibility(activeIndex, false);
    if (activeIndex === 0) {
      activeIndex = list.length - 1;
    } else {
      activeIndex--;
    }
    handleVisibility(activeIndex, true);
  };

  const handleNext = () => {
    if (activeIndex === null) {
      resetActiveIndex();
    }
    handleVisibility(activeIndex, false);
    if (activeIndex === list.length - 1) {
      activeIndex = 0;
    } else {
      activeIndex++;
    }
    handleVisibility(activeIndex, true);
  };

  const handleReset = () => {
    handleVisibility(activeIndex, false);
    activeIndex = null;
  };

  const leftBtn = document.querySelector(".arrow-left");
  const rightBtn = document.querySelector(".arrow-right");
  leftBtn.addEventListener("click", handlePrev);
  rightBtn.addEventListener("click", handleNext);
  // on right arrow key press
  document.onkeydown = function (e) {
    switch (e.key) {
      case "ArrowLeft":
        handlePrev();
        break;
      case "ArrowRight":
        handleNext();
        break;
      case "Escape":
        handleReset();
        break;
      default:
        console.log(e.key);
        break;
    }
  };
});
