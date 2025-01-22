document.getElementById("terrain").addEventListener("click", function () {
  // Create modal element
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.padding = "20px";
  modal.style.backgroundColor = "white";
  modal.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
  modal.style.zIndex = "1000";

  // Create distance button
  const distanceButton = document.createElement("button");
  distanceButton.id = "distance";
  distanceButton.textContent = "Distance";

  // Append distance button to modal
  modal.appendChild(distanceButton);

  // Append modal to body
  document.body.appendChild(modal);
});
