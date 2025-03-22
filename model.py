import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv

class GNN(torch.nn.Module):
    def __init__(self, input_dim, hidden_dim=64, output_dim=2):
        super(GNN, self).__init__()
        self.input_dim = input_dim
        self.conv1 = GCNConv(input_dim, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, output_dim)

    def forward(self, data):
        x, edge_index = data.x, data.edge_index
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        return F.log_softmax(x, dim=1)

def load_trained_gnn_model(model_path, input_dim):
    model = GNN(input_dim=input_dim)
    device = torch.device('cpu')
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model
