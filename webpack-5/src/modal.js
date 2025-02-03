// Terrain Analysis 버튼 클릭 시 모달 창을 띄우는 함수
export function displayTerrainAnalysisModal() {
  const modal = document.createElement("div");
  modal.className = "select-modal modal";

  const title = document.createElement("div");
  title.className = "modal-title";

  const titleText = document.createElement("h3");
  titleText.textContent = "Terrain Analysis";
  title.appendChild(titleText);

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.className = "close-btn";
  closeButton.onclick = () => {
    document.body.removeChild(modal);
  };

  title.appendChild(closeButton);
  modal.appendChild(title);

  const content = document.createElement("div");
  content.className = "modal-content";

  const distanceAnalysisButton = document.createElement("button");
  distanceAnalysisButton.textContent = "Analysis Distance";
  distanceAnalysisButton.className = "analysis-btn";
  distanceAnalysisButton.id = "distance";
  content.appendChild(distanceAnalysisButton);

  const analysisTerrainProfileButton = document.createElement("button");
  analysisTerrainProfileButton.textContent = "Terrain Profile Analysis";
  analysisTerrainProfileButton.className = "analysis-btn";
  analysisTerrainProfileButton.id = "terrain-profile";
  content.appendChild(analysisTerrainProfileButton);

  const analysisSlopeButton = document.createElement("button");
  analysisSlopeButton.textContent = "Slope Analysis";
  analysisSlopeButton.className = "analysis-btn";
  analysisSlopeButton.id = "slope";
  content.appendChild(analysisSlopeButton);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

export function addEventListenerById(id, event, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener(event, handler);
  } else {
    console.error(`Element with id ${id} not found.`);
  }
}

// 모달 창 닫기 함수
export function closeModal() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    document.body.removeChild(modal);
  });
}

// 툴 모달 닫기 함수
export function closeToolModal() {
  const toolModals = document.querySelectorAll(".tool-modal");
  toolModals.forEach((modal) => {
    // @ts-ignore
    modal.style.display = "none";
  });
}

// 모든 .modal 요소에 hidden 클래스를 추가하는 함수
export function hideAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.classList.add("hidden");
  });
}
