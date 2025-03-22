import asyncio
import random
import torch
import numpy as np
import shap
import os
from fastapi import FastAPI, WebSocket
import uvicorn
from model import load_trained_gnn_model
import torch.nn.functional as F

app = FastAPI()
connected_clients = []
threat_queue = asyncio.Queue()

SAVE_DIR = "saved_models"
os.makedirs(SAVE_DIR, exist_ok=True)
RETRAINED_MODEL_PATH = os.path.join(SAVE_DIR, "gnn_retrained_latest.pth")

INPUT_DIM = 18
PACKET_LOSS_PROB = 0.1  # 10% packet loss
MIN_LATENCY = 0.1  # 100ms minimum delay
MAX_LATENCY = 0.5  # 500ms maximum delay (jitter range)

def save_model(model, path=RETRAINED_MODEL_PATH):
    torch.save(model.state_dict(), path)
    print(f"[Retrain] Model saved to {path}")

def load_model(path, input_dim):
    print(f"[Load] Loading model from {path}")
    return load_trained_gnn_model(path, input_dim)

def evaluate_model(model, test_data):
    model.eval()
    correct = 0
    total = len(test_data)
    with torch.no_grad():
        for x, y in test_data:
            x_tensor = torch.tensor(x, dtype=torch.float)
            edge_index = torch.tensor([[0], [0]], dtype=torch.long)
            data = type('Data', (object,), {'x': x_tensor, 'edge_index': edge_index})
            output = model(data)
            predicted = output.argmax(dim=1).item()
            if predicted == y:
                correct += 1
    return correct / total if total > 0 else 0

if os.path.exists(RETRAINED_MODEL_PATH):
    model_gnn = load_model(RETRAINED_MODEL_PATH, INPUT_DIM)
else:
    model_gnn = load_model("gnn_security_model.pth", INPUT_DIM)

model_gnn.train()

optimizer = torch.optim.Adam(model_gnn.parameters(), lr=0.001)
loss_fn = torch.nn.CrossEntropyLoss()

recent_data = []

def model_predict(x_numpy):
    x_tensor = torch.tensor(x_numpy, dtype=torch.float)
    edge_index = torch.tensor([[0], [0]], dtype=torch.long)
    data = type('Data', (object,), {'x': x_tensor, 'edge_index': edge_index})
    with torch.no_grad():
        output = model_gnn(data)
        return output.numpy()

explainer = shap.KernelExplainer(model_predict, np.random.rand(1, INPUT_DIM))

devices = ["Camera A1", "Smart Lock B2", "Thermostat T3"]

def rl_select_action(prediction):
    return random.choice(["No Action", "Quarantine", "Patch", "Block IP"])

@app.websocket("/ws/threats")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await asyncio.sleep(10)
    except:
        connected_clients.remove(websocket)
        print("Client disconnected")

async def broadcast_threat(data):
    for client in connected_clients.copy():
        if random.random() < PACKET_LOSS_PROB:
            print("[Network] Packet lost, skipping message")
            continue

        latency = random.uniform(MIN_LATENCY, MAX_LATENCY)
        await asyncio.sleep(latency)
        
        try:
            await client.send_json(data)
        except:
            connected_clients.remove(client)
            print("Removed a disconnected client")

@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(simulate_attack_loop())
    asyncio.create_task(process_threats())
    asyncio.create_task(online_learning_loop())

async def process_threats():
    while True:
        data = await threat_queue.get()
        await broadcast_threat(data)

async def simulate_attack_loop():
    while True:
        device = random.choice(devices)
        fake_log = np.random.rand(1, INPUT_DIM)
        x_input = torch.tensor(fake_log, dtype=torch.float)

        edge_index = torch.tensor([[0], [0]], dtype=torch.long)
        data = type('Data', (object,), {'x': x_input, 'edge_index': edge_index})

        with torch.no_grad():
            output = model_gnn(data)
            prediction = output.argmax(dim=1).item()

        actual = random.choice([0, 1])
        action = rl_select_action(prediction)

        shap_values = explainer.shap_values(fake_log)
        top_features = np.argsort(np.abs(shap_values[0][0]))[::-1][:3]

        feature_importance = [
            {"feature": f"Feature_{i}", "value": float(shap_values[0][0][i])}
            for i in top_features
        ]

        threat_data = {
            "device": device,
            "prediction": prediction,
            "actual": actual,
            "action": action,
            "timestamp": asyncio.get_event_loop().time(),
            "feature_importance": feature_importance
        }

        recent_data.append((fake_log[0], actual))
        if len(recent_data) > 500:
            recent_data.pop(0)

        print("Sending threat:", threat_data)
        await threat_queue.put(threat_data)
        await asyncio.sleep(2)

async def online_learning_loop():
    while True:
        await asyncio.sleep(60)
        if len(recent_data) >= 50:
            print("[Retrain] Updating model with recent data...")
            batch = random.sample(recent_data, 50)
            features_batch, labels_batch = zip(*batch)
            X = torch.tensor(np.array(features_batch), dtype=torch.float)
            y = torch.tensor(labels_batch, dtype=torch.long)

            edge_index = torch.tensor([[0], [0]], dtype=torch.long)
            data = type('Data', (object,), {'x': X, 'edge_index': edge_index})

            optimizer.zero_grad()
            output = model_gnn(data)
            loss = loss_fn(output, y)
            loss.backward()
            optimizer.step()

            new_accuracy = evaluate_model(model_gnn, recent_data[-100:])
            previous_accuracy = evaluate_model(load_model(RETRAINED_MODEL_PATH, INPUT_DIM), recent_data[-100:])

            if new_accuracy > previous_accuracy:
                print(f"[Retrain] New model accuracy ({new_accuracy:.4f}) is better than previous ({previous_accuracy:.4f}). Saving model.")
                save_model(model_gnn)
            else:
                print(f"[Retrain] New model accuracy ({new_accuracy:.4f}) is worse or equal to previous ({previous_accuracy:.4f}). Not saving model.")
        else:
            print("[Retrain] Not enough data yet to retrain.")

if __name__ == "__main__":
    uvicorn.run("unified_backend_sim:app", host="0.0.0.0", port=8000, reload=True)