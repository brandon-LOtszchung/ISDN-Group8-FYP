import cv2
from pathlib import Path
from typing import Dict, List, Tuple

from services.video_processor import VideoProcessor
from services.image_analyzer import ImageAnalyzer
from services.inventory_service import InventoryService

class VideoFlowService:
    """Orchestrate the complete video processing flow"""
    
    FAMILY_ID = "00000000-0000-0000-0000-000000000001"
    
    def __init__(self):
        self.video_processor = VideoProcessor(red_line_ratio=0.8)
        self.image_analyzer = ImageAnalyzer()
        self.inventory_service = InventoryService(family_id=self.FAMILY_ID)
    
    def process_video(self, video_path: str) -> Dict:
        """
        Complete video processing flow
        
        Args:
            video_path: Path to video file
        
        Returns:
            Dict with processing results
        """
        if not Path(video_path).exists():
            return {"success": False, "error": "Video file not found"}
        
        # Step 1: Process video to extract moments
        result = self.video_processor.process_video(video_path)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        if not result["moment1"]:
            return {"success": False, "error": "Moment 1 (hand entering) not detected"}
        
        if not result["moment2"]:
            return {"success": False, "error": "Moment 2 (hand exiting) not detected"}
        
        # Step 2: Save best frames
        m1 = result["moment1"]
        m2 = result["moment2"]
        
        moment1_path = "/tmp/moment1_frame.jpg"
        moment2_path = "/tmp/moment2_frame.jpg"
        
        cv2.imwrite(moment1_path, m1["frame"])
        cv2.imwrite(moment2_path, m2["frame"])
        
        # Step 3: Get inventory context
        inventory_context = self.inventory_service.format_inventory_for_prompt()
        
        # Step 4: Analyze both moments with AI
        moment1_data = self.image_analyzer.analyze_hand(moment1_path, inventory_context)
        moment2_data = self.image_analyzer.analyze_hand(moment2_path, inventory_context)
        
        moment1_items = moment1_data.get("items", [])
        moment2_items = moment2_data.get("items", [])
        
        # Step 5: Compare moments and determine actions
        put_actions, taken_actions = self._compare_moments(moment1_items, moment2_items)
        
        # Step 6: Update database
        for action in put_actions:
            self.inventory_service.apply_action("PUT", action['name'], action['category'], action['quantity'])
        
        for action in taken_actions:
            self.inventory_service.apply_action("TAKEN", action['name'], action['category'], action['quantity'])
        
        # Step 7: Get updated inventory
        updated_inventory = self.inventory_service.get_inventory()
        
        # Cleanup temp files
        try:
            Path(moment1_path).unlink(missing_ok=True)
            Path(moment2_path).unlink(missing_ok=True)
        except:
            pass
        
        return {
            "success": True,
            "moment1": {
                "frame_index": m1["frame_index"],
                "sharpness": m1["sharpness"],
                "items": moment1_items
            },
            "moment2": {
                "frame_index": m2["frame_index"],
                "sharpness": m2["sharpness"],
                "items": moment2_items
            },
            "actions": {
                "put": put_actions,
                "taken": taken_actions
            },
            "updated_inventory": updated_inventory
        }
    
    def _compare_moments(self, moment1_items: List[Dict], moment2_items: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Compare two moments to determine PUT and TAKEN actions
        
        Returns:
            Tuple of (put_actions, taken_actions)
        """
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

