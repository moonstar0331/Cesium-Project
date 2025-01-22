// Terrain Analysis 버튼 클릭 시 모달 창을 띄우는 함수
export function displayTerrainAnalysisModal() {
  const modal = document.createElement("div");
  modal.className = "select-modal";

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

  const analysisButton = document.createElement("button");
  analysisButton.textContent = "Analysis Distance";
  analysisButton.className = "analysis-btn";
  analysisButton.id = "distance";

  content.appendChild(analysisButton);

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
