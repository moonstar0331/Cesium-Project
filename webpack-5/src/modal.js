export function addEventListenerById(id, event, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener(event, handler);
  } else {
    console.error(`Element with id ${id} not found.`);
  }
}

// 모든 .modal 요소에 hidden 클래스를 추가하는 함수
export function hideAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.classList.add("hidden");
  });
}
