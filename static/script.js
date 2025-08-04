const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const previewContainer = document.getElementById("preview-container");
const previewImage = document.getElementById("preview-image");
const resultDiv = document.getElementById("result");
const predictionLabel = document.getElementById("prediction-label");
const chartCanvas = document.getElementById("probability-chart");
let chartInstance = null;

// Drag and Drop Events
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
	dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
	e.preventDefault();
	dropZone.classList.remove("dragover");

	const file = e.dataTransfer.files[0];
	handleImage(file);
});

fileInput.addEventListener("change", () => {
	const file = fileInput.files[0];
	handleImage(file);
});

function handleImage(file) {
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (e) {
		previewImage.src = e.target.result;
		previewContainer.classList.remove("hidden");
	};
	reader.readAsDataURL(file);

	// Upload to server
	const formData = new FormData();
	formData.append("image", file);

	fetch("/predict", {
		method: "POST",
		body: formData,
	})
		.then((res) => res.json())
		.then((data) => {
			showResult(data);
		})
		.catch((err) => {
			alert("Prediction failed. Check server logs.");
			console.error(err);
		});
}

function showResult(data) {
	resultDiv.classList.remove("hidden");
	predictionLabel.textContent = `${data.label} (${(
		data.probability * 100
	).toFixed(2)}%)`;

	const chartData = {
		labels: ["Fake", "Real"],
		datasets: [
			{
				label: "Probability",
				data: [data.probabilities[0], data.probabilities[1]],
				backgroundColor: ["#f44336", "#4caf50"],
			},
		],
	};

	if (chartInstance) {
		chartInstance.destroy();
	}

	chartInstance = new Chart(chartCanvas, {
		type: "bar",
		data: chartData,
		options: {
			scales: {
				y: { beginAtZero: true, max: 1 },
			},
		},
	});
}
