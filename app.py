from flask import Flask, render_template, request, jsonify
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

app = Flask(__name__)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model
model = models.shufflenet_v2_x1_0(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, 2)
model.load_state_dict(torch.load("shufflenetv3_fake_real.pth", map_location=DEVICE))
model.to(DEVICE)
model.eval()

CLASSES = ["Fake", "Real"]

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3, [0.5]*3)
])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'})
    file = request.files['image']
    image = Image.open(file).convert('RGB')
    img_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        output = model(img_tensor)
        probs = torch.nn.functional.softmax(output, dim=1)[0]
        pred_index = torch.argmax(probs).item()
        probabilities = probs.cpu().numpy().tolist()

    return jsonify({
        'prediction': CLASSES[pred_index],
        'probabilities': probabilities
    })

if __name__ == '__main__':
    app.run(debug=True)
