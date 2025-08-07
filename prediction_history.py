import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid

class PredictionHistory:
    def __init__(self, history_file: str = "prediction_history.json"):
        self.history_file = history_file
        self.ensure_history_file()
    
    def ensure_history_file(self):
        """Garante que o arquivo de histórico existe"""
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
    
    def save_prediction(self, 
                       content_path: str, 
                       notes: List[Dict[str, Any]], 
                       content_type: str = "file",
                       metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Salva uma predição no histórico
        
        Args:
            content_path: Caminho do arquivo ou URL do YouTube
            notes: Lista de notas detectadas
            content_type: Tipo de conteúdo ("file" ou "youtube")
            metadata: Metadados adicionais (opcional)
        
        Returns:
            ID único da predição
        """
        prediction_id = str(uuid.uuid4())
        
        prediction_data = {
            "id": prediction_id,
            "timestamp": datetime.now().isoformat(),
            "content_path": content_path,
            "content_type": content_type,
            "notes_count": len(notes),
            "notes": notes,
            "metadata": metadata or {}
        }
        
        # Carrega o histórico existente
        with open(self.history_file, 'r', encoding='utf-8') as f:
            history = json.load(f)
        
        # Adiciona a nova predição no início da lista
        history.insert(0, prediction_data)
        
        # Mantém apenas as últimas 100 predições para não sobrecarregar o arquivo
        if len(history) > 100:
            history = history[:100]
        
        # Salva o histórico atualizado
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
        
        return prediction_id
    
    def get_all_predictions(self) -> List[Dict[str, Any]]:
        """Retorna todas as predições do histórico"""
        with open(self.history_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_prediction_by_id(self, prediction_id: str) -> Optional[Dict[str, Any]]:
        """Retorna uma predição específica pelo ID"""
        predictions = self.get_all_predictions()
        for prediction in predictions:
            if prediction["id"] == prediction_id:
                return prediction
        return None
    
    def get_recent_predictions(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna as predições mais recentes"""
        predictions = self.get_all_predictions()
        return predictions[:limit]
    
    def delete_prediction(self, prediction_id: str) -> bool:
        """Remove uma predição do histórico"""
        predictions = self.get_all_predictions()
        original_length = len(predictions)
        
        predictions = [p for p in predictions if p["id"] != prediction_id]
        
        if len(predictions) < original_length:
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(predictions, f, ensure_ascii=False, indent=2)
            return True
        return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas do histórico"""
        predictions = self.get_all_predictions()
        
        if not predictions:
            return {
                "total_predictions": 0,
                "file_predictions": 0,
                "youtube_predictions": 0,
                "total_notes_detected": 0,
                "average_notes_per_prediction": 0
            }
        
        file_count = sum(1 for p in predictions if p["content_type"] == "file")
        youtube_count = sum(1 for p in predictions if p["content_type"] == "youtube")
        total_notes = sum(p["notes_count"] for p in predictions)
        
        return {
            "total_predictions": len(predictions),
            "file_predictions": file_count,
            "youtube_predictions": youtube_count,
            "total_notes_detected": total_notes,
            "average_notes_per_prediction": total_notes / len(predictions) if predictions else 0
        }

# Instância global para uso no servidor
prediction_history = PredictionHistory() 