import cv2
import logging
from pathlib import Path
from typing import Dict, List, Tuple

from .video_processor import VideoProcessor
from .image_analyzer import ImageAnalyzer
from .inventory_service import InventoryService

logger = logging.getLogger(__name__)

class VideoFlowService:
    def __init__(self, family_id: str):
        self.family_id = family_id
        self.video_processor = VideoProcessor(red_line_ratio=0.8)
        self.image_analyzer = ImageAnalyzer()
        self.inventory_service = InventoryService(family_id=family_id)
    
    def process_video(self, video_path: str) -> Dict:
        if not Path(video_path).exists():
            return {"success": False, "error": "Video file not found"}
        
        result = self.video_processor.process_video(video_path)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        if not result["moment1"]:
            return {"success": False, "error": "Moment 1 (hand entering) not detected"}
        
        if not result["moment2"]:
            return {"success": False, "error": "Moment 2 (hand exiting) not detected"}
        
        m1 = result["moment1"]
        m2 = result["moment2"]
        
        moment1_path = "/tmp/moment1_frame.jpg"
        moment2_path = "/tmp/moment2_frame.jpg"
        
        cv2.imwrite(moment1_path, m1["frame"])
        cv2.imwrite(moment2_path, m2["frame"])
        
        inventory_context = self.inventory_service.format_inventory_for_prompt()
        
        moment1_data = self.image_analyzer.analyze_hand(moment1_path, inventory_context)
        moment2_data = self.image_analyzer.analyze_hand(moment2_path, inventory_context)

        moment1_items = moment1_data.get("items", [])
        moment2_items = moment2_data.get("items", [])

        logger.info(
            "video_flow family=%s moment1_items=%s moment2_items=%s",
            self.family_id, moment1_items, moment2_items,
        )

        put_actions, taken_actions = self._compare_moments(moment1_items, moment2_items)

        logger.info(
            "video_flow family=%s diff put=%s taken=%s",
            self.family_id, put_actions, taken_actions,
        )

        for action in put_actions:
            ok = self.inventory_service.apply_action("PUT", action['name'], action['category'], action['quantity'])
            logger.info("video_flow PUT result name=%s ok=%s", action['name'], ok)

        for action in taken_actions:
            ok = self.inventory_service.apply_action("TAKEN", action['name'], action['category'], action['quantity'])
            logger.info("video_flow TAKEN result name=%s ok=%s", action['name'], ok)
        
        try:
            Path(moment1_path).unlink(missing_ok=True)
            Path(moment2_path).unlink(missing_ok=True)
        except:
            pass
        
        return {
            "success": True,
            "actions": {
                "put": put_actions,
                "taken": taken_actions
            }
        }
    
    def _compare_moments(self, moment1_items: List[Dict], moment2_items: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        items1_dict = {item['name']: item for item in moment1_items}
        items2_dict = {item['name']: item for item in moment2_items}
        
        all_items = set(items1_dict.keys()) | set(items2_dict.keys())
        
        put_actions = []
        taken_actions = []
        
        for item_name in all_items:
            qty1 = items1_dict.get(item_name, {}).get('quantity', 0)
            qty2 = items2_dict.get(item_name, {}).get('quantity', 0)
            
            diff = qty2 - qty1
            
            if diff > 0:
                put_actions.append({
                    'name': item_name,
                    'quantity': diff,
                    'category': items2_dict[item_name]['category']
                })
            elif diff < 0:
                taken_actions.append({
                    'name': item_name,
                    'quantity': abs(diff),
                    'category': items1_dict[item_name]['category']
                })
        
        return put_actions, taken_actions

